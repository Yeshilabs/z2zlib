// // import { MyProgram } from "./zkprogram";
// import { Field } from "o1js";

// //export type ProofOutput = Awaited<ReturnType<typeof generateBaseCaseProof>>;

// export async function generateBaseCaseProof() {
//     try {
//         console.log("compiling program");
//         const verificationKey = await MyProgram.compile();
//         console.log("program compiled");
//         const proof = await MyProgram.baseCase(Field(1));
//         console.log("generated proof");
//         return proof.toJSON();
//     } catch (error) {
//         console.error("Error generating proof:", error);
//         throw error;
//     }
// }
// export async function generateInductiveCaseProof() {
//     try {
//         console.log("compiling program");
//         const verificationKey = await MyProgram.compile();
//         console.log("program compiled");
//         const proof = await MyProgram.inductiveCase();
//         console.log("generated proof");
//         return proof.toJSON();
//     } catch (error) {
//         console.error("Error generating proof:", error);
//         throw error;
//     }
// }