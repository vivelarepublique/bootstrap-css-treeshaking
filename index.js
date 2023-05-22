const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { argv } = require('process');

const css = readFileSync('bootstrap.css', { encoding: 'utf-8' });

const paragraph = (css.includes('\r\n') ? css.split(/(?<=\r\n\})\r\n(?=\r\n)/gm) : css.split(/(?<=\n\})\n(?=\n)/gm)).map(el => el.trim());
const cssContent = paragraph.map(el => {
    const index = el.indexOf('{');
    return {
        selector: el.substring(0, index),
        content: el.substring(index),
        overall: el,
    };
});

if (argv?.[2]) {
    const html = readFileSync(argv[2], { encoding: 'utf-8' });
    const body = html.match(/(?<=<body>)([\s\S]*)(?=<\/body>)/i)?.[0];

    //elements
    const elements = body.match(/(?<=<)\w+(?=\s)/g);
    const elementArray = Array.from(new Set(elements));

    const step1Result = [];

    elementArray.forEach(el => {
        const elRegex = new RegExp(`(?<![\\.\\-])${el}(?![\\.\\-])`, 'g');
        cssContent.forEach(({ selector, overall }) => {
            if (elRegex.test(selector) && !selector.includes('.') && !selector.includes('type')) step1Result.push(overall);
        });
    });

    //class names
    const classNames = body.match(/(?<=class=").+?(?=")/g);
    const classNameArray = Array.from(new Set(Array.from(classNames).reduce((acc, cur) => acc.concat(cur.split(' ')), [])));

    const step2Result = [];

    classNameArray.forEach(el => {
        const elRegex = new RegExp(`(?<=\\.)${el}(?!-)`, 'g');

        cssContent.forEach(({ selector, overall }) => {
            if (elRegex.test(selector)) step2Result.push(overall);
        });
    });

    //types
    const types = body.match(/(?<=type=").+?(?=")/g);
    const typesArray = Array.from(new Set(types));

    const step3Result = [];

    typesArray.forEach(el => {
        const elString = `[type="${el}"]`;
        cssContent.forEach(({ selector, overall }) => {
            if (selector.includes(elString)) step3Result.push(overall);
        });
    });

    console.log(elementArray, '\n', classNameArray, '\n', typesArray);

    const minCss = Array.from(new Set([...step1Result, ...step2Result, ...step3Result]))
        .reduce((acc, cur) => acc + '\n\n' + cur, '')
        .trim();

    writeFileSync(join('test/', 'min.css'), minCss);
}

// console.log('\x1b[31mRed text\x1b[0m');
// console.log('\x1b[32mGreen text\x1b[0m');
// console.log('\x1b[33mYellow text\x1b[0m');
// console.log('\x1b[34mBlue text\x1b[0m');
// console.log('\x1b[35mMagenta text\x1b[0m');
// console.log('\x1b[36mCyan text\x1b[0m');
