const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const concat = require('gulp-concat');
const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');
const uglify = require('uglify-es');

const buildConfigs = require('./build-configs');
// whether need 
const minify = hasOption("-m");

// build
gulp.task('build', function() {
    const builds = mergeBuildConfigs(buildConfigs);
    const total = builds.length
    let built = 0
    const next = () => {
        buildEntry(builds[built++]).then(() => {
            if (built < total) {
                next()
            }
        })
    }

    next()
});

function mergeBuildConfigs(buildConfigs) {
    return buildConfigs.map((config) => {
        return {
            input: config.entry,
            plugins: [
                resolve(),
                commonjs(),
                babel({
                    exclude: 'node_modules/**' // only transpile our source code
                })
            ],
            output: {
                file: config.dest,
                format: config.format,
                name: 'tvdom'
            }
        };
    });
}

function buildEntry(config) {
    const output = config.output;

    return rollup.rollup(config)
        .then(bundle => bundle.generate(output))
        .then(({ code }) => {
            if (minify) {
                const result = uglify.minify(code);
                if (result.error) {
                    throw new Error(result.error);
                }
                code = result.code;
            }
            return write(output.file, code);
        });
}

function write(dest, code) {
    return new Promise((resolve, reject) => {
        function report() {
            console.log(blue(path.relative(process.cwd(), dest)) + ' ' + getSize(code));
            resolve();
        }

        fs.writeFile(dest, code, err => {
            if (err) return reject(err)
            report();
        });
    })
}

function getSize(code) {
    return (code.length / 1024).toFixed(2) + 'kb'
}

function blue(str) {
    return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}

function hasOption(option) {
    return process.argv.indexOf(option) > 0;
}
