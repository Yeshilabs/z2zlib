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

const MyProgram: ReturnType<typeof ZkProgram> = ZkProgram({
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

const MyProof: ReturnType<typeof ZkProgram.Proof> = ZkProgram.Proof(MyProgram);

export { MyProgram, MyProof };