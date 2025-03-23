import fs from "node:fs"
import path from "node:path";
import { generateEmailVerifierInputs } from "@zk-email/zkemail-nr";
import { ZKEmailProver } from "@zk-email/zkemail-nr/dist/prover";
import type { CompiledCircuit } from "@noir-lang/noir_js";
import type { Abi } from "@noir-lang/types";


// Import the circuit using dynamic import
const email = fs.readFileSync(path.join(__dirname, "../public/email.eml"));


const inputParams = {
    maxHeadersLength: 512,
    maxBodyLength: 1024,
};

export async function emailVerifier() {
    try {
        // Dynamically import the circuit
        const circuit2048 = await import("../../circuits/email/target/email.json");
        // Cast the imported circuit to CompiledCircuit type to fix type mismatch
        const compiledCircuit: CompiledCircuit = {
            bytecode: circuit2048.default.bytecode,
            abi: circuit2048.default.abi as Abi // Using type assertion to bypass type checking
        };
        const prover = new ZKEmailProver(compiledCircuit, "plonk", 10);

        const inputs = await generateEmailVerifierInputs(email, inputParams);
        const proof = await prover.fullProve(inputs);
        const result = await prover.verify(proof);
        console.log("Email verification result:", result);
        return result;
    } catch (error) {
        console.error("Error in email verification:", error);
        throw error;
    }
}

export default emailVerifier;
