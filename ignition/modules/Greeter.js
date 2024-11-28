const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const GreeterModule = buildModule("GreeterModule", (m) => {
  const greet = m.contract("Greeter", ["Hola"]);
  return { greet };
});

module.exports = GreeterModule;