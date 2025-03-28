import { compile, createFileManager } from "@noir-lang/noir_wasm"
import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';
import initNoirC from "@noir-lang/noirc_abi";
import initACVM from "@noir-lang/acvm_js";
import acvm from "@noir-lang/acvm_js/web/acvm_js_bg.wasm?url";
import noirc from "@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url";

import main from "../../circuits/tax/src/main.nr?url";
import nargoToml from "../../circuits/tax/Nargo.toml?url";

const show = (id: string, content: string) => {
  const container = document.getElementById(id);
  if (!container) return;
  container.appendChild(document.createTextNode(content));
  container.appendChild(document.createElement("br"));
};

let isInitialized = false;

async function initializeDependencies() {
  if (isInitialized) return;

  try {
    show("logs", "Initializing Noir dependencies... ⏳");
    await Promise.all([
      initACVM(fetch(acvm)),
      initNoirC(fetch(noirc))
    ]);
    isInitialized = true;
    show("logs", "Noir dependencies initialized successfully ✅");
  } catch (error) {
    show("logs", "Failed to initialize Noir dependencies ❌");
    console.error("Initialization error:", error);
    throw error;
  }
}

document.getElementById("submit")?.addEventListener("click", async () => {
  try {
    if (!isInitialized) {
      await initializeDependencies();
    }

    const { program } = await getCircuit();
    const noir = new Noir(program);
    const backend = new UltraHonkBackend(program.bytecode);

    const totalReceived = (document.getElementById("totalReceived") as HTMLInputElement).value;
    const totalExpenses = (document.getElementById("totalExpenses") as HTMLInputElement).value;
    const calculatedTax = (document.getElementById("estimatedTax") as HTMLInputElement).value;

    show("logs", "Generating witness... ⏳");
    const { witness } = await noir.execute({
      raw_data: {
        total_received: Number(totalReceived),
        total_expenses: Number(totalExpenses)
      },
      input_tax: Number(calculatedTax)
    });
    show("logs", "Generated witness... ✅");

    show("logs", "Generating proof... ⏳");
    const proof = await backend.generateProof(witness);
    show("logs", "Generated proof... ✅");
    show("results", Buffer.from(proof.proof).toString('hex'));

    show('logs', 'Verifying proof... ⌛');
    const isValid = await backend.verifyProof(proof);
    show("logs", `Proof is ${isValid ? "Valid Calculation" : "Invalid Calculation"}... ✅`);

  } catch (error) {
    show("logs", "Error occurred during proof generation 💔");
    console.error("Error:", error);
  }
});

// document.getElementById("email")?.addEventListener("click", async () => {
//   try {
//     if (!isInitialized) {
//       await initializeDependencies();
//     }
//     await emailVerifier();
//   } catch (error) {
//     show("logs", "Error occurred during email verification 💔");
//     console.error("Error:", error);
//   }
// });

export async function getCircuit() {
  const fm = createFileManager("/");
  const mainResponse = await fetch(main);
  const nargoTomlResponse = await fetch(nargoToml);

  if (!mainResponse.body || !nargoTomlResponse.body) {
    throw new Error("Failed to fetch circuit files");
  }

  fm.writeFile("./src/main.nr", mainResponse.body);
  fm.writeFile("./Nargo.toml", nargoTomlResponse.body);
  return await compile(fm);
}

// Initialize the application
initializeDependencies().catch(error => {
  console.error("Failed to initialize application:", error);
});
