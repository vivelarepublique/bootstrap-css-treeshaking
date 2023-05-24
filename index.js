const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { argv } = require('process');
const { createInterface } = require('readline');

const css = readFileSync('bootstrap.css', { encoding: 'utf-8' });

const paragraph = (css.includes('\r\n') ? css.split(/(?<=\r\n\})\r\n(?=\r\n)/gm) : css.split(/(?<=\n\})\n(?=\n)/gm)).map(el => el.trim());
const cssContent = paragraph.map(el => {
    const index = el.indexOf('{');
    return {
        selector: el
            .substring(0, index)
            .split(',')
            .map(items => items.trim()),
        content: el.substring(index),
        overall: el,
    };
});

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});
prompt();

function prompt() {
    rl.question('Do you need to load the styles of \x1b[34mhtml\x1b[0m and \x1b[33mbody\x1b[0m? (\x1b[32myes\x1b[0m/\x1b[31mno\x1b[0m, default is \x1b[32myes\x1b[0m): ', input => {
        input = input.trim().toLowerCase();

        if (input === 'yes' || !input) {
            writeCssFile(true, argv?.[2]);
            rl.close();
        } else if (input === 'no') {
            writeCssFile(false, argv?.[2]);
            rl.close();
        } else {
            console.log('unrecognized input!');
            prompt();
        }
    });
}

function writeCssFile(defaultValue, fileArgument) {
    const specialElements = ['html', 'body'];

    if (fileArgument) {
        const html = readFileSync(argv[2], { encoding: 'utf-8' });
        const body = html.match(/(?<=<body>)([\s\S]*)(?=<\/body>)/i)?.[0];

        //specialElements
        const specialElementsResult = [];
        if (defaultValue) {
            specialElements.forEach(el => specialElementsResult.push(cssContent.find(({ selector }) => selector?.[0].trim() === el).overall));
            specialElementsResult.push(`*,\n*::before,\n*::after {\n\tbox-sizing: border-box;\n}`);
        }

        //elements
        const elements = body.match(/(?<=<)\w+(?=\s|(?=>))/g);
        const elementArray = Array.from(new Set(elements));

        const step1Result = [];

        elementArray.forEach(el => {
            cssContent.forEach(({ selector, overall }) => {
                if (selector.includes(el) && !selector.includes('.') && !selector.includes('type')) step1Result.push(overall);
                selector.forEach(item => {
                    if (item.includes(':') && item.substring(0, item.indexOf(':')) === el) step1Result.push(overall);
                });
            });
        });

        //class names
        const classNames = body.match(/(?<=class=")[a-zA-Z0-9\-\s]+?(?=")/g);
        const classNameArray = Array.from(new Set(Array.from(classNames).reduce((acc, cur) => acc.concat(cur.split(' ')), [])));

        const step2Result = [];

        classNameArray.forEach(el => {
            cssContent.forEach(({ selector, overall }) => {
                if (selector.includes(`.${el}`)) step2Result.push(overall);
                selector.forEach(item => {
                    if (item.includes(':') && item.substring(1, item.indexOf(':')) === el) step1Result.push(overall);
                });
            });
        });

        //types
        const types = body.match(/(?<=type=").+?(?=")/g);
        const typesArray = Array.from(new Set(types));

        const step3Result = [];

        typesArray.forEach(el => {
            const elString = `input[type=\"${el}\"]`;
            cssContent.forEach(({ selector, overall }) => {
                if (selector.includes(elString)) step3Result.push(overall);
            });
        });

        console.log(elementArray, '\n', classNameArray, '\n', typesArray);

        const minCss = Array.from(new Set([...specialElementsResult, ...step1Result, ...step2Result, ...step3Result]))
            .reduce((acc, cur) => acc + '\n\n' + cur, '')
            .trim();

        writeFileSync(join('test/', 'min.css'), minCss);
    } else {
        console.log('The template html file was not found, please make sure that the command you executed contains an html file. \nSuch as: node .\\index.js test/index.html');
    }
}
