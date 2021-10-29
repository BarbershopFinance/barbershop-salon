export const barbershopConfig = () => {
  const hairToken = '0x100a947f51fa3f1dcdf97f3ae507a72603cae63c';
  const barber = '0xC6Ae34172bB4fC40c49C3f53badEbcE3Bb8E6430';
  const feeRecipient = '0x81a93bC3b73505C78F1C831402B350cF538F2968';
  const devWallet = '0x81a93bC3b73505C78F1C831402B350cF538F2968';
  const testDev = '0x69bf7c78499DB8a42043f511fc085Fe5dD7b8407';

  return {
    barber,
    devWallet: testDev,
    feeRecipient: testDev,
    hairToken,
  };
};

export default barbershopConfig;