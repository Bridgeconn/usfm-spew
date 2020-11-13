const { spawn } = require('child_process');
const concat = require('concat-stream');
const { EOL } = require('os');
const assert = require('assert');


function createProcess(args = [], env = null) {
  // args = [processPath].concat(args);

  return spawn('usfm-grammar', args, {
    env: Object.assign(
      {
        NODE_ENV: 'test'
      },
      env
    )
  });
}

function execute(processPath, args = [], opts = {}) {
  const { env = null } = opts;
  const childProcess = createProcess(args, env);
  childProcess.stdin.setEncoding('utf-8');  
  const promise = new Promise((resolve, reject) => {
    childProcess.stderr.once('data', err => {
      reject(err.toString());
    });    
    childProcess.on('error', reject);    
    childProcess.stdout.pipe(
      concat(result => {
        resolve(result.toString());
      })
    );
  });
  return promise;
}


describe('version and help', () => {
  it('version with --version', async () => {
    const response = await execute(
      'usfm-grammar',
      ['--version']
    );
    const versionPattern = new RegExp('^\\d\\.\\d\\.\\d.*', 'g');
    assert.match(response, versionPattern);
  });

  it('version with -v', async () => {
    const response = await execute(
      'usfm-grammar',
      ['-v']
    );
    const versionPattern = new RegExp('^\\d\\.\\d\\.\\d.*', 'g');
    assert.match(response, versionPattern);
  });

  it('No arg', async () => {
  	let thrownError = false;
  	try {
	    const response = await execute(
	      'usfm-grammar',
	      []
	    );
  	} catch (err){
  		thrownError = true;
  		const helpPattern = new RegExp('^usfm-grammar <file-path>\n.*', 'g');
	    assert.match(err, helpPattern);
  	}
  	assert.strictEqual(thrownError, true);
  });

  it('Wrong argument', async () => {
  	let thrownError = false;
  	try {
	    const response = await execute(
	      'usfm-grammar',
	      ['-f']
	    );
  	} catch (err){
  		thrownError = true;
  		const helpPattern = new RegExp('^usfm-grammar <file-path>\n.*', 'g');
	    assert.match(err, helpPattern);
  	}
  	assert.strictEqual(thrownError, true)
  });


  it('help with -h', async () => {
    const response = await execute(
      'usfm-grammar',
      ['-h']
    );
    const helpPattern = new RegExp('^usfm-grammar <file-path>\n.*', 'g');
    assert.match(response, helpPattern);
  });

  it('help with --help', async () => {
    const response = await execute(
      'usfm-grammar',
      ['--help']
    );
    const helpPattern = new RegExp('^usfm-grammar <file-path>\n.*', 'g');
    assert.match(response, helpPattern);
  });

});

describe('USFM parsing', () => {
  it('one file argument', async () => {
    const response = await execute(
      'usfm-grammar',
      ['./test/resources/small.usfm']
    );
    jsonObj = JSON.parse(response);
    assert.strictEqual(Object.keys(jsonObj).includes('book'), true);
    assert.strictEqual(Object.keys(jsonObj).includes('chapters'), true);
  });

  it('with invalid file', async () => {
    const response = await execute(
	      'usfm-grammar',
	      ['./test/test.js']
	    );
    const jsonObj = JSON.parse(response)
    assert.strictEqual(Object.keys(jsonObj).includes('_messages'), true);
    assert.strictEqual(Object.keys(jsonObj._messages).includes('_error'), true);
  });

  it('level relaxed, with --level=relaxed', async () => {
    const response = await execute(
      'usfm-grammar',
      ['./test/resources/small.usfm', '--level=relaxed']
    );
    jsonObj = JSON.parse(response);
    assert.strictEqual(Object.keys(jsonObj).includes('book'), true);
    assert.strictEqual(Object.keys(jsonObj).includes('chapters'), true);
  });

  it('level relaxed,  with -l relaxed', async () => {
    const response = await execute(
      'usfm-grammar',
      ['./test/resources/small.usfm', '-l', 'relaxed']
    );
    jsonObj = JSON.parse(response);
    assert.strictEqual(Object.keys(jsonObj).includes('book'), true);
    assert.strictEqual(Object.keys(jsonObj).includes('chapters'), true);
  });

  it('level relaxed, with --level relaxed', async () => {
    const response = await execute(
      'usfm-grammar',
      ['./test/resources/small.usfm', '--level', 'relaxed']
    );
    jsonObj = JSON.parse(response);
    assert.strictEqual(Object.keys(jsonObj).includes('book'), true);
    assert.strictEqual(Object.keys(jsonObj).includes('chapters'), true);
  });

  it('level, without value', async () => {
  	let thrownError = false;
  	try {
	    const response = await execute(
	      'usfm-grammar',
	      ['--level']
	    );
  	} catch (err){
  		thrownError = true;
  		const helpPattern = new RegExp('^usfm-grammar <file-path>\n.*', 'g');
	    assert.match(err, helpPattern);
  	}
  	assert.strictEqual(thrownError, true);
  });

  it('scripture filtered, with --filter scripture', async () => {
    const response = await execute(
      'usfm-grammar',
      ['./test/resources/small.usfm', '--filter', 'scripture']
    );
    jsonObj = JSON.parse(response);
    assert.strictEqual(Object.keys(jsonObj).includes('book'), true);
    assert.strictEqual(Object.keys(jsonObj).includes('chapters'), true);
  });

  it('filter with wrong value', async () => {
  	let thrownError = false;
  	try {
	    const response = await execute(
	      'usfm-grammar',
	      ['./test/resources/small.usfm', '--level', 'bible']
	    );
  	} catch (err){
  		thrownError = true;
  		const helpPattern = new RegExp('^usfm-grammar <file-path>\n.*', 'g');
	    assert.match(err, helpPattern);
  	}
  	assert.strictEqual(thrownError, true)
  });

  it('both filter and level arguments', async () => {
    const response = await execute(
      'usfm-grammar',
      ['./test/resources/small.usfm', '--filter', 'scripture', '--level', 'relaxed']
    );
    jsonObj = JSON.parse(response);
    assert.strictEqual(Object.keys(jsonObj).includes('book'), true);
    assert.strictEqual(Object.keys(jsonObj).includes('chapters'), true);
  });

  it('output file specified, with -o', async () => {
    const response = await execute(
      'usfm-grammar',
      ['./test/resources/small.usfm', '-o', './test/resources/small1.json']
    );
    assert.strictEqual(response, '');
  });

  it('output file specified, with --output file-name', async () => {
    const response = await execute(
      'usfm-grammar',
      ['./test/resources/small.usfm', '--output', './test/resources/small2.json']
    );
    assert.strictEqual(response, '');
  });

  it('output format specified, with --format==csv', async () => {
    const response = await execute(
      'usfm-grammar',
      ['./test/resources/small.usfm', '--format=csv']
    );
    const csvPattern = new RegExp('Book, Chapter, Verse, Text\n.*', 'g');
    assert.match(response, csvPattern);
  });


});

describe('JSON parsing', () => {
  it('with one json file-path', async () => {
    const response = await execute(
      'usfm-grammar',
      ['./test/resources/small.json']
    );
    const usfmPattern = new RegExp('^\\\\id GEN A small sample usfm file\n.*', 'g');
    assert.match(response, usfmPattern);
  });

  it('with additional arguments', async () => {
    const response = await execute(
      'usfm-grammar',
      ['./test/resources/small.json', '--filter', 'scripture']
    );
    const usfmPattern = new RegExp('^\\\\id GEN A small sample usfm file\n.*', 'g');
    assert.match(response, usfmPattern);
  });


});