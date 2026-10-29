function isPrime(num) {
    //return false;
    if (num <= 1) return false;
    if (num === 2) return true;
    if (num % 2 === 0) return false;

    const boundary = Math.sqrt(num);
    for (let i = 3; i <= boundary; i += 2) {
        if (num % i === 0) return false;
    }
  
    return true;
}

module.exports = {
    isPrime
}