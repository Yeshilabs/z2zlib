import {
    Field,
    ZkProgram,
    verify,
    Proof,
    JsonProof,
    Provable,
    Empty,
    Poseidon,
} from 'o1js';

export { MyProgram, MyProof };

let MyProgram = ZkProgram({
    name: 'example-with-output',
    publicOutput: Field,

    methods: {
        baseCase: {
            privateInputs: [],
            async method() {
                return Field(0);
            },
        },

        inductiveCase: {
            privateInputs: [],
            async method() {
                return Field(1);
            },
        },
    },
});

const MyProof = ZkProgram.Proof(MyProgram);