const { ethers } = require('ethers');
const readlineSync = require('readline-sync');

// RPC URL
const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

// Функция для задержки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function phaseOne() {
    const numRecipients = readlineSync.questionInt('Сколько у вас будет промежуточных получателей? ');

    const intermediateWallets = [];
    
    // Запрос приватных ключей промежуточных кошельков и конечных адресов
    for (let i = 0; i < numRecipients; i++) {
        const privateKey = readlineSync.question(`Введите приватный ключ для промежуточного кошелька ${i + 1}: `);
        const destinationAddress = readlineSync.question(`Введите конечный адрес для кошелька ${i + 1}: `);
        intermediateWallets.push({ privateKey, destinationAddress }); // Сохраняем приватный ключ и конечный адрес
    }

    const sourcePrivateKey = readlineSync.question('Введите приватный ключ исходного кошелька для пополнения: ');
    const sourceWallet = new ethers.Wallet(sourcePrivateKey).connect(provider);

    const amountToSend = ethers.utils.parseEther('0.1'); // Укажите сумму для отправки

    // Отправка токенов на промежуточные кошельки
    for (const walletInfo of intermediateWallets) {
        const wallet = new ethers.Wallet(walletInfo.privateKey).connect(provider);
        try {
            const tx = await sourceWallet.sendTransaction({
                to: wallet.address, // Используем адрес промежуточного кошелька
                value: amountToSend,
            });
            console.log(`Транзакция отправлена с ${sourceWallet.address} на ${wallet.address}: ${tx.hash}`);
            await tx.wait();
            console.log(`Транзакция подтверждена для ${wallet.address}`);
            
            // Задержка от 10 секунд до 1 минуты
            const delayTime = Math.floor(Math.random() * (60000 - 10000 + 1)) + 10000; // от 10 до 60 секунд
            await delay(delayTime);
        } catch (error) {
            console.error(`Ошибка при отправке с ${sourceWallet.address} на ${wallet.address}:`, error);
        }
    }

    return intermediateWallets;
}

async function phaseTwo(intermediateWallets) {
    for (let i = 0; i < intermediateWallets.length; i++) {
        const walletInfo = intermediateWallets[i];
        const wallet = new ethers.Wallet(walletInfo.privateKey).connect(provider);

        const amountToSend = ethers.utils.parseEther('0.1'); // Укажите сумму для отправки

        try {
            const tx = await wallet.sendTransaction({
                to: walletInfo.destinationAddress,
                value: amountToSend,
            });
            console.log(`Транзакция отправлена с ${wallet.address}: ${tx.hash}`);
            await tx.wait();
            console.log(`Транзакция подтверждена для ${walletInfo.destinationAddress}`);
            
            // Задержка от 10 секунд до 1 минуты
            const delayTime = Math.floor(Math.random() * (60000 - 10000 + 1)) + 10000; // от 10 до 60 секунд
            await delay(delayTime);
        } catch (error) {
            console.error(`Ошибка при отправке с ${wallet.address}:`, error);
        }
    }
}

async function main() {
    const intermediateWallets = await phaseOne();
    await phaseTwo(intermediateWallets);
}

main().catch(console.error);