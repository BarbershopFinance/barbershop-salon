const fs = require('fs');
const path = require('path');

const getCurrentDirectoryBase = () => {
	return path.basename(process.cwd());
};

const directoryExists = (filePath) => {
	return fs.existsSync(filePath);
};

const readJSONFile = async (filePath) => {
	try {
		const buffer = await fs.promises.readFile(filePath, 'utf8');
		return JSON.parse(buffer);
	} catch (e) {
		throw new Error(`Error reading ${filePath}: ${e}`);
	}
};

const writeJSONToFile = async (fileName, data) => {
	try {
		await fs.promises.writeFile(fileName, JSON.stringify(data, null, 4));
	} catch (e) {
		console.error(`Error writing ${fileName}: ${e}`);
	}
};

const writeArrayToCSV = async (fileName, data) => {
	// Construct the comma seperated string
	// If a column values contains a comma then surround the column value by double quotes
	const csv = data
		.map((row) =>
			row
				.map(
					(item) =>
						typeof item === 'string' && item.indexOf(',') >= 0
							? `"${item}"`
							: String(item)
				)
				.join(',')
		)
		.join('\n');

	try {
		await fs.promises.writeFile(fileName, csv);
	} catch (e) {
		console.error(`Error writing ${fileName}: ${e}`);
	}
};

const writeMarkdownTableToFile = async (fileName, data) => {
	let tableString = '';

	const columnWidth = data[0].length;
	const headerDivider = '\n |' + '-------------|'.repeat(columnWidth);

	for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
		const rowDetails = data[rowIdx];
		tableString = tableString.concat('|');
		for await (const detail of rowDetails) {
			tableString = tableString.concat(detail + '|');
		}
		if (rowIdx === 0) {
			tableString = tableString.concat(headerDivider);
		}
		tableString = tableString.concat('\n');
	}

	try {
		await fs.promises.writeFile(fileName, tableString);
	} catch (e) {
		console.error(`Error writing ${fileName}: ${e}`);
	}
};

module.exports = {
	directoryExists,
	getCurrentDirectoryBase,
	readJSONFile,
	writeArrayToCSV,
	writeJSONToFile,
	writeMarkdownTableToFile,
};