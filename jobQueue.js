const Queue = require('bull');
const fs = require('fs-extra');
const { exec } = require('child_process');
const path = require('path');
const { v4: uuid } = require('uuid');
const { performance } = require('perf_hooks');

const codeQueue = new Queue('code-queue', {
  redis: { host: '127.0.0.1', port: 6379 },
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

const logToFile = (msg) => {
  const log = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync('log.txt', log);
};

codeQueue.process(async (job, done) => {
  const { language, code, input } = job.data;
  const id = uuid();
  const tempDir = path.join(__dirname, 'code', id);
  const codeFile = path.join(tempDir, FILE_NAMES[language]);
  const inputFile = path.join(tempDir, 'input.txt');

  try {
    await fs.ensureDir(tempDir);
    await fs.writeFile(codeFile, code.slice(0, 5000)); // limit code size
    await fs.writeFile(inputFile, input.slice(0, 1024)); // limit input size

    const mountDir = `/app/${id}`;
    const commands = {
      cpp: `g++ Main.cpp -o a.out && ./a.out < input.txt`,
      c: `gcc Main.c -o a.out && ./a.out < input.txt`,
      java: `javac Main.java && java Main < input.txt`,
      py: `python3 Main.py < input.txt`,
      js: `node Main.js < input.txt`,
    };

    const runCmd = `docker run --rm --network none -v ${tempDir}:${mountDir} -w ${mountDir} --memory=100m --cpus=0.5 ${IMAGE_MAP[language]} "${commands[language]}"`;

    const start = performance.now();

    exec(runCmd, { timeout: 7000 }, async (err, stdout, stderr) => {
      const end = performance.now();
      const executionTime = `${(end - start).toFixed(2)} ms`;

      await fs.remove(tempDir); // clean up

      let output = stdout.trim();
      let errorOutput = stderr.trim();
      let response = { executionTime };

      if (err) {
        response.output = errorOutput || err.message;
        response.status = "error";
        logToFile(`[${language}] ❌ ERROR: ${response.output}`);
        return done(null, response);
      }

      if (errorOutput) {
        response.output = errorOutput;
        response.status = "error";
        logToFile(`[${language}] ⚠️ STDERR: ${response.output}`);
        return done(null, response);
      }

      response.output = output;
      response.status = "success";
      logToFile(`[${language}] ✅ Output: ${response.output}`);
      return done(null, response);
    });

  } catch (err) {
    await fs.remove(tempDir);
    done(new Error('Execution failed: ' + err.message));
  }
});

module.exports = codeQueue;
