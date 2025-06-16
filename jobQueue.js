const Queue = require('bull');
const fs = require('fs-extra');
const { exec } = require('child_process');
const path = require('path');
const { v4: uuid } = require('uuid');
const { performance } = require('perf_hooks');

const codeQueue = new Queue('code-queue', {
  redis: { host: '127.0.0.1', port: 6379 },
  defaultJobOptions: {
    removeOnComplete: true, // keep Redis clean
    removeOnFail: false,
    timeout: 10000,          // job-level timeout safeguard
    attempts: 1
  }
});

const FILE_NAMES = {
  cpp: 'Main.cpp',
  c: 'Main.c',
  java: 'Main.java',
  py: 'Main.py',
  js: 'Main.js',
};

const IMAGE_MAP = {
  cpp: 'lang-cpp',
  c: 'lang-c',
  java: 'lang-java',
  py: 'lang-py',
  js: 'lang-js',
};

const MAX_CODE_LENGTH = 5000;
const MAX_INPUT_LENGTH = 1024;
const CONTAINER_MEM = '100m';
const CONTAINER_CPU = '0.5';

const logToFile = (msg) => {
  fs.appendFile('log.txt', `[${new Date().toISOString()}] ${msg}\n`).catch(() => {});
};

codeQueue.process(10, async (job, done) => {
  const { language, code, input } = job.data;
  const id = uuid();
  const tempDir = path.join(__dirname, 'code', id);
  const codeFile = path.join(tempDir, FILE_NAMES[language]);
  const inputFile = path.join(tempDir, 'input.txt');
  const mountDir = `/app/${id}`;

  try {
    const safeCode = code?.slice(0, MAX_CODE_LENGTH) || '';
    const safeInput = input?.slice(0, MAX_INPUT_LENGTH) || '';

    await fs.ensureDir(tempDir);
    await Promise.all([
      fs.writeFile(codeFile, safeCode),
      fs.writeFile(inputFile, safeInput)
    ]);

    const commands = {
      cpp: `g++ Main.cpp -o a.out && ./a.out < input.txt`,
      c: `gcc Main.c -o a.out && ./a.out < input.txt`,
      java: `javac Main.java && java Main < input.txt`,
      py: `python3 Main.py < input.txt`,
      js: `node Main.js < input.txt`,
    };

    const dockerCmd = `docker run --rm --network none --memory=${CONTAINER_MEM} --cpus=${CONTAINER_CPU} -v "${tempDir}":"${mountDir}" -w "${mountDir}" ${IMAGE_MAP[language]} "${commands[language]}"`;

    const start = performance.now();

    exec(dockerCmd, { timeout: 7000 }, async (err, stdout, stderr) => {
      const end = performance.now();
      const executionTime = `${(end - start).toFixed(2)} ms`;
      await fs.remove(tempDir).catch(() => {});

      const response = { executionTime };

      if (err) {
        response.status = "error";
        response.output = stderr.trim() || err.message;
        logToFile(`[${language}] ❌ ERROR: ${response.output}`);
        return done(null, response);
      }

      const stderrOut = stderr.trim();
      const stdoutOut = stdout.trim();

      if (stderrOut) {
        response.status = "error";
        response.output = stderrOut;
        logToFile(`[${language}] ⚠️ STDERR: ${response.output}`);
      } else {
        response.status = "success";
        response.output = stdoutOut;
        logToFile(`[${language}] ✅ Output: ${response.output}`);
      }

      return done(null, response);
    });
  } catch (err) {
    await fs.remove(tempDir).catch(() => {});
    logToFile(`[${language}] ❌ Uncaught Exception: ${err.message}`);
    return done(new Error('Execution failed: ' + err.message));
  }
});

module.exports = codeQueue;
