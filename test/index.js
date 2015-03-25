'use strict';

/*
 * Dependencies.
 */

var mdastGitHub = require('..');
var mdast = require('mdast');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var diff = require('diff');
var chalk = require('chalk');

/*
 * Methods.
 */

var read = fs.readFileSync;
var readdir = fs.readdirSync;

/*
 * Constants.
 */

var ROOT = path.join(__dirname, 'fixtures');

/*
 * Fixtures.
 */

var fixtures = readdir(ROOT);

/**
 * Shortcut to process.
 *
 * @param {string} value
 * @return {string}
 */
function github(value, repo) {
    var parser;
    var options;

    if (typeof repo === 'string' || !repo) {
        options = {
            'repository': repo || null
        };
    } else {
        options = repo;
    }

    parser = mdast.use(mdastGitHub, options);

    return parser.stringify(parser.parse(value));
}

/*
 * Tests.
 */

describe('mdast-github()', function () {
    it('should be a function', function () {
        assert(typeof mdastGitHub === 'function');
    });

    it('should not throw if not passed options', function () {
        assert.doesNotThrow(function () {
            mdastGitHub(mdast);
        });
    });
});

/**
 * Diff text.
 *
 * @param {string} value
 * @param {string} baseline
 */
function compare(value, baseline) {
    var difference;

    try {
        assert(value === baseline);
    } catch (error) {
        /* istanbul ignore next */
        difference = diff.diffLines(value, baseline);

        difference.forEach(function (change) {
            var colour = change.added ?
                'green' : change.removed ? 'red' : 'dim';

            process.stderr.write(chalk[colour](change.value));
        });

        /* istanbul ignore next */
        throw error;
    }
}

/**
 * Describe a fixtures.
 *
 * @param {string} fixture
 */
function describeFixture(fixture) {
    it('should work on `' + fixture + '`', function () {
        var filepath = ROOT + '/' + fixture;
        var output = read(filepath + '/Output.md', 'utf-8');
        var input = read(filepath + '/Input.md', 'utf-8');
        var result = github(input, 'wooorm/mdast');

        compare(result, output);
    });
}

/**
 * Describe a repo URL.
 *
 * @param {Array.<string>} repo
 */
function describeRepository(repo) {
    var user = repo[1];
    var project = repo[2];

    repo = repo[0];

    it('should work on `' + repo + '`', function () {
        var input;
        var output;
        var result;

        input = [
            '-   SHA: a5c3785ed8d6a35868bc169f07e40e889087fd2e',
            '-   User@SHA: wooorm@a5c3785ed8d6a35868bc169f07e40e889087fd2e',
            '-   #Num: #26',
            '-   GH-Num: GH-26',
            '-   User#Num: wooorm#26'
        ].join('\n') + '\n';

        output = [
            '-   SHA: [a5c3785](https://github.com/' + user + '/' + project +
                '/commit/a5c3785ed8d6a35868bc169f07e40e889087fd2e)',
            '-   User@SHA: [wooorm@a5c3785](https://github.com/wooorm/' +
                project + '/commit/a5c3785ed8d6a35868bc169f07e40e889087fd2e)',
            '-   # Num: [#26](https://github.com/' + user + '/' + project +
                '/issues/26)',
            '-   GH-Num: [GH-26](https://github.com/' + user + '/' + project +
                '/issues/26)',
            '-   User#Num: [wooorm#26](https://github.com/wooorm/' + project +
                '/issues/26)'
        ].join('\n') + '\n';

        result = github(input, repo);

        compare(result, output);
    });
}

/*
 * Gather fixtures.
 */

fixtures = fixtures.filter(function (filepath) {
    return filepath.indexOf('.') !== 0;
});

describe('Fixtures', function () {
    fixtures.forEach(describeFixture);
});

/*
 * List of repo references possible in `package.json`s.
 *
 * From repo-utils/parse-github-repo-url, with some
 * tiny additions.
 */

var repositories = [
    [
        'component/emitter',
        'component',
        'emitter'
    ],
    [
        'https://github.com/component/emitter',
        'component',
        'emitter'
    ],
    [
        'git://github.com/component/emitter.git',
        'component',
        'emitter'
    ],
    [
        'https://github.com/repos/component/emitter/tarball',
        'component',
        'emitter'
    ],
    [
        'https://github.com/repos/component/emitter/zipball',
        'component',
        'emitter'
    ],
    [
        'https://codeload.github.com/component/emitter/legacy.zip',
        'component',
        'emitter'
    ],
    [
        'https://codeload.github.com/component/emitter/legacy.tar.gz',
        'component',
        'emitter'
    ],
    [
        'component/emitter#1',
        'component',
        'emitter'
    ],
    [
        'component/emitter@1',
        'component',
        'emitter'
    ],
    [
        'component/emitter#"1"',
        'component',
        'emitter'
    ],
    [
        'component/emitter@"1"',
        'component',
        'emitter'
    ],
    [
        'git://github.com/component/emitter.git#1',
        'component',
        'emitter'
    ],
    [
        'https://github.com/repos/component/emitter/tarball/1',
        'component',
        'emitter'
    ],
    [
        'https://github.com/repos/component/emitter/zipball/1',
        'component',
        'emitter'
    ],
    [
        'https://codeload.github.com/component/emitter/legacy.zip/1',
        'component',
        'emitter'
    ],
    [
        'https://codeload.github.com/component/emitter/legacy.tar.gz/1',
        'component',
        'emitter'
    ],
    [
        'https://github.com/component/emitter/archive/1.tar.gz',
        'component',
        'emitter'
    ],
    [
        'github/.gitignore',
        'github',
        '.gitignore'
    ],
    [
        'github/.gitc',
        'github',
        '.gitc'
    ]
];

describe('Repositories', function () {
    repositories.forEach(describeRepository);
});

describe('Miscellaneous', function () {
    it('should load a `package.json` when available', function () {
        assert(
            github('test@12345678', null) ===
            '[test@1234567](https://github.com/' +
            'test/mdast-github/commit/12345678)\n'
        );
    });

    it('should accept a `repository.url` in a `package.json`', function () {
        var cwd = process.cwd;

        /**
         * Move cwd to a path without another
         * `package.json`.
         */
        function fakeCWD() {
            return cwd() + '/test';
        }

        process.cwd = fakeCWD;

        compare(
            github('12345678', null),
            '[1234567](https://github.com/' +
            'wooorm/mdast/commit/12345678)\n'
        );

        process.cwd = cwd;
    });

    it('should not fail on ASTs without `position`', function () {
        var parser = mdast.use(mdastGitHub);
        var ast = {
            'type': 'root',
            'children': [
                {
                    'type': 'paragraph',
                    'children': [
                        {
                            'type': 'text',
                            'value': '12345678'
                        }
                    ]
                }
            ]
        };

        compare(
            parser.stringify(parser.run(ast)),
            '[1234567](https://github.com/' +
            'wooorm/mdast-github/commit/12345678)\n'
        );
    });

    it('should throw without `repository`', function () {
        var cwd = process.cwd;

        /**
         * Move cwd to a path without a `package.json`.
         */
        function fakeCWD() {
            return cwd() + '/test/fixtures';
        }

        process.cwd = fakeCWD;

        assert.throws(function () {
            github('1234567', null);
        }, /Missing `repository`/);

        process.cwd = cwd;
    });
});