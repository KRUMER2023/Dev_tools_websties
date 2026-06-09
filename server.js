const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS for frontend cross-origin requests
app.use(cors());

// Enable JSON body parsing
app.use(express.json());

// Target JSON file path
const DATA_FILE_PATH = path.join(__dirname, 'datas', 'tools.json');

// Helper: Read tools database file
function readToolsData() {
  if (!fs.existsSync(DATA_FILE_PATH)) {
    throw new Error('Database file does not exist.');
  }
  const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
  if (!fileContent.trim()) {
    return { Tools: [] };
  }
  return JSON.parse(fileContent);
}

// Helper: Write tools database file
function writeToolsData(data) {
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Helper: Simple URL Validation
function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;  
  }
}

// API Endpoint: Get Tools (optional helper, but good for local API tests)
app.get('/api/tools', (req, res) => {
  try {
    const data = readToolsData();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API Endpoint: Add Tool
app.post('/api/tools/add', (req, res) => {
  try {
    let { name, description, category, url } = req.body;

    // Validation checks
    if (!name || !description || !category || !url) {
      return res.status(400).json({ success: false, message: 'All fields (Name, Description, Category, URL) are required.' });
    }

    // Trim whitespace values
    name = name.trim();
    description = description.trim();
    category = category.trim();
    url = url.trim();

    if (!name || !description || !category || !url) {
      return res.status(400).json({ success: false, message: 'Values cannot contain only whitespace.' });
    }

    if (!isValidURL(url)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid absolute URL (e.g., https://example.com).' });
    }

    const data = readToolsData();
    const tools = data.Tools || [];

    // Duplicate URL check (URL is unique identifier)
    const duplicateExists = tools.some(tool => tool.url.toLowerCase() === url.toLowerCase());
    if (duplicateExists) {
      return res.status(400).json({ success: false, message: 'Duplicate URL: A tool with this URL already exists.' });
    }

    const newTool = { name, description, category, url };
    tools.push(newTool);
    data.Tools = tools;

    writeToolsData(data);

    res.status(201).json({
      success: true,
      message: '✓ Tool Added Successfully',
      tool: newTool
    });
  } catch (error) {
    console.error('Add Tool Error:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
});

// API Endpoint: Delete Tools
app.post('/api/tools/delete', (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ success: false, message: 'No URLs specified for deletion.' });
    }

    const data = readToolsData();
    const tools = data.Tools || [];
    
    // Normalize target urls for check
    const targetUrls = urls.map(u => u.trim().toLowerCase());
    
    const initialCount = tools.length;
    const remainingTools = tools.filter(tool => !targetUrls.includes(tool.url.trim().toLowerCase()));
    const deletedCount = initialCount - remainingTools.length;

    if (deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'No matching tools found to delete.' });
    }

    data.Tools = remainingTools;
    writeToolsData(data);

    res.status(200).json({
      success: true,
      message: `✓ ${deletedCount} Tool${deletedCount > 1 ? 's' : ''} Deleted`,
      deletedCount: deletedCount
    });
  } catch (error) {
    console.error('Delete Tools Error:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
});

// Start express application listening
app.listen(PORT, () => {
  console.log(`Tools Dashboard Backend running locally on http://localhost:${PORT}`);
});
