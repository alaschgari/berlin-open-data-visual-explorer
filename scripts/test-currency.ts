
import { parseCurrency } from '../src/lib/parser';

const tests = [
    { input: "1.000,50", expected: 1000.50, desc: "German format with thousand dot" },
    { input: "1000,50", expected: 1000.50, desc: "German format without thousand dot" },
    { input: "1,000.50", expected: 1000.50, desc: "Intl format with thousand comma" },
    { input: "1000.50", expected: 1000.50, desc: "Intl format without thousand comma" },
    { input: "50,00", expected: 50.00, desc: "German small number" },
    { input: "50.00", expected: 50.00, desc: "Intl small number" },
    { input: 123.45, expected: 123.45, desc: "Number input" },
    { input: "invalid", expected: 0, desc: "Invalid input" },
    { input: "1.234.567,89", expected: 1234567.89, desc: "Large German number" },
    { input: "1,234,567.89", expected: 1234567.89, desc: "Large Intl number" },
];

console.log("Running Currency Parser Tests...\n");

let passed = 0;
tests.forEach(test => {
    const result = parseCurrency(test.input);
    if (result === test.expected) {
        console.log(`✅ ${test.desc}: ${test.input} -> ${result}`);
        passed++;
    } else {
        console.error(`❌ ${test.desc}: ${test.input} -> ${result} (Expected: ${test.expected})`);
    }
});

console.log(`\nPassed ${passed}/${tests.length} tests.`);
