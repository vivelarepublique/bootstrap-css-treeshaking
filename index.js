const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { argv } = require('process');

const css = readFileSync('bootstrap.css', { encoding: 'utf-8' });

const paragraph = css.split(/(?<=\n\})\n(?=\n)/gm).map(el => el.trim());
const cssContent = paragraph.map(el => {
    const index = el.indexOf('{');
    return {
        selector: el.substring(0, index),
        content: el,
    };
});

if (argv?.[2]) {
    const html = readFileSync(argv[2], { encoding: 'utf-8' });
    const body = html.match(/(?<=<body>)([\s\S]*)(?=<\/body>)/i)?.[0];
    const elements = body.match(/(?<=<)\w+(?=\s)/g);
    const elementArray = Array.from(new Set(elements));

    const result = [];

    elementArray.forEach(el => {
        const elRegex1 = new RegExp(`(?<!-)${el}\\s`, 'g');
        const elRegex2 = new RegExp(`(?<!-)${el},`, 'g');
        cssContent.forEach(({ selector, content }) => {
            if (elRegex1.test(selector) || elRegex2.test(selector)) {
                result.push(content);
            }
        });
    });

    const minCss = result.reduce((acc, cur) => acc + '\n\n' + cur, '');

    writeFileSync(join('test/', 'min.css'), minCss);

    console.log(elementArray);
}

// console.log('\x1b[31mRed text\x1b[0m');
// console.log('\x1b[32mGreen text\x1b[0m');
// console.log('\x1b[33mYellow text\x1b[0m');
// console.log('\x1b[34mBlue text\x1b[0m');
// console.log('\x1b[35mMagenta text\x1b[0m');
// console.log('\x1b[36mCyan text\x1b[0m');
