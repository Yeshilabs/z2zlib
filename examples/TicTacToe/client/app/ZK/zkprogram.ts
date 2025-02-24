// import {
//     Field,
//     ZkProgram,
//     verify,
//     Proof,
//     JsonProof,
//     Provable,
//     Empty,
//     Poseidon,
// } from 'o1js';

// import { State, StateTransition, BaseState, StateConstructor } from 'z2zlib';

// const MyProgram: ReturnType<typeof ZkProgram> = ZkProgram({
//     name: 'example-with-output',
//     publicOutput: Field,
//     methods: {
//         baseCase: {
//             privateInputs: [Field],
//             async method(input: Field) {
//                 input.assertEquals(Field(1));
//                 return Field(0);
//             },
//         },
//         inductiveCase: {
//             privateInputs: [],
//             async method() {
//                 return Field(1);
//             },
//         },
//     },
// });

// const MyProof: ReturnType<typeof ZkProgram.Proof> = ZkProgram.Proof(MyProgram);

// export { MyProgram, MyProof };




// const StateTransitionProgram: ReturnType<typeof ZkProgram> = ZkProgram({
//     name: 'stateTransitionProgram',
//     publicOutput: Field,
//     methods: {
//         baseCase: {
//             privateInputs: [BaseState],
//             async method(input: BaseState) {
//                 return Field(0);
//             },
//         },
//         inductiveCase: {
//             privateInputs: [],
//             async method() {
//                 return Field(1);
//             },
//         },
//     },
// });