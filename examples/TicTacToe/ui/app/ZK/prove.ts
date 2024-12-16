import { MyProgram } from "./zkprogram";

export type ProofOutput = Awaited<ReturnType<typeof generateBaseCaseProof>>;

export async function generateBaseCaseProof() {
    try {
        console.log("compiling program");
        await MyProgram.compile();
        console.log("program compiled");
        const proof = await MyProgram.baseCase();
        console.log("generated proof");
        return proof.toJSON();
    } catch (error) {
        console.error("Error generating proof:", error);
        throw error;
    }
}