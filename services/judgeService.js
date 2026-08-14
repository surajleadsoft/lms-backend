const axios = require("axios");

// ============================================================
// JUDGE0 CONFIGURATION
// ============================================================

const JUDGE_TIMEOUT = 60000;

const JUDGE0_URL =
    "https://judge0-ce.p.rapidapi.com/submissions";

const API_KEY =
    "90b6e44b46msh7cf016e49d43e06p16ec0fjsn433cfec9a908";

const JUDGE0_HOST =
    "judge0-ce.p.rapidapi.com";


// ============================================================
// JUDGE0 LANGUAGE IDS
// ============================================================

const languages = {
    c: 50,
    cpp: 54,
    java: 62,
    python: 71,
    javascript: 63
};


// ============================================================
// NORMALIZE LANGUAGE
// ============================================================

const normalizeLanguage = (language) => {

    if (!language) {
        return "";
    }

    const value = String(language)
        .trim()
        .toLowerCase();

    switch (value) {

        case "c":
            return "c";

        case "cpp":
        case "c++":
        case "cplus":
        case "c_plus_plus":
            return "cpp";

        case "java":
            return "java";

        case "python":
        case "python3":
            return "python";

        case "javascript":
        case "js":
        case "node":
        case "nodejs":
            return "javascript";

        default:
            return value;
    }
};


// ============================================================
// BASE64 ENCODE
// ============================================================

const encodeBase64 = (value) => {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return Buffer
        .from(String(value), "utf8")
        .toString("base64");
};


// ============================================================
// EXECUTE JUDGE0
// ============================================================

const executeJudge0 = async ({
    language,
    sourceCode,
    stdin = ""
}) => {

    // ========================================================
    // NORMALIZE LANGUAGE
    // ========================================================

    const normalizedLanguage =
        normalizeLanguage(language);


    // ========================================================
    // GET LANGUAGE ID
    // ========================================================

    const languageId =
        languages[normalizedLanguage];


    // ========================================================
    // VALIDATE LANGUAGE
    // ========================================================

    if (!languageId) {

        throw new Error(
            `Unsupported language: ${language}`
        );

    }


    // ========================================================
    // VALIDATE SOURCE CODE
    // ========================================================

    if (
        sourceCode === null ||
        sourceCode === undefined ||
        !String(sourceCode).trim()
    ) {

        throw new Error(
            "Source code is required"
        );

    }


    // ========================================================
    // LOG
    // ========================================================

    console.log(
        `Judge0: ${language} -> ${normalizedLanguage} -> ${languageId}`
    );


    // ========================================================
    // BASE64 ENCODE
    //
    // IMPORTANT:
    //
    // Judge0 expects base64_encoded=true when sending
    // encoded source code/stdin.
    // ========================================================

    const encodedSourceCode =
        encodeBase64(
            sourceCode
        );

    const encodedStdin =
        encodeBase64(
            stdin
        );


    // ========================================================
    // JUDGE0 PAYLOAD
    // ========================================================

    const payload = {

        source_code:
            encodedSourceCode,

        stdin:
            encodedStdin,

        language_id:
            languageId

    };


    // ========================================================
    // SEND REQUEST
    // ========================================================

    try {

        const response =
            await axios.post(

                `${JUDGE0_URL}?base64_encoded=true&wait=true`,

                payload,

                {

                    headers: {

                        "Content-Type":
                            "application/json",

                        "X-RapidAPI-Key":
                            API_KEY,

                        "X-RapidAPI-Host":
                            JUDGE0_HOST

                    },

                    timeout:
                        JUDGE_TIMEOUT

                }

            );


        // ====================================================
        // RETURN RESPONSE
        // ====================================================

        return response.data;

    } catch (error) {

        // ====================================================
        // LOG JUDGE0 ERROR
        // ====================================================

        console.error(
            "Judge0 API Error:"
        );

        if (
            error.response
        ) {

            console.error(
                "Status:",
                error.response.status
            );

            console.error(
                "Response:",
                error.response.data
            );

        } else {

            console.error(
                "Message:",
                error.message
            );

        }


        // ====================================================
        // THROW CLEAN ERROR
        // ====================================================

        throw new Error(

            error.response?.data?.error ||

            error.response?.data?.message ||

            error.message ||

            "Judge0 execution failed"

        );

    }

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    executeJudge0,
    normalizeLanguage,
    languages
};