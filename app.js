const { program } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const express = require('express');
const app = express();
const upload = multer();

program
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <cache>', 'cache directory path')
  .parse(process.argv);

const options = program.opts();

const host = options.host;
const port = options.port;
const cachePath = options.cache;

// Перевірка наявності обов'язкових параметрів
if (!host || !port || !cachePath) {
  console.error('Error: all options --host, --port, and --cache are required');
  process.exit(1); // Зупиняє програму, якщо відсутні параметри
}

// Створення директорії для нотаток, якщо вона не існує
const ensureCacheDir = async () => {
  try {
    await fs.mkdir(cachePath, { recursive: true });
  } catch (err) {
    console.error('Error creating cache directory:', err);
    process.exit(1);
  }
};

ensureCacheDir();

// Налаштування express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Отримання конкретної нотатки
app.get('/notes/:name', async (req, res) => {
  const notePath = path.join(cachePath, req.params.name);
  try {
    const note = await fs.readFile(notePath, 'utf8');
    res.send(note);
  } catch (err) {
    res.status(404).send('Note not found');
  }
});

// Оновлення нотатки
app.put('/notes/:name', express.text(), async (req, res) => {
  const notePath = path.join(cachePath, req.params.name);
  try {
    await fs.access(notePath);
    await fs.writeFile(notePath, req.body);
    res.send('Note updated');
  } catch (err) {
    res.status(404).send('Note not found');
  }
});

// Видалення нотатки
app.delete('/notes/:name', async (req, res) => {
  const notePath = path.join(cachePath, req.params.name);
  try {
    await fs.unlink(notePath);
    res.send('Note deleted');
  } catch (err) {
    res.status(404).send('Note not found');
  }
});

// Отримання списку всіх нотаток
app.get('/notes', async (req, res) => {
  try {
    const files = await fs.readdir(cachePath);
    const notes = await Promise.all(files.map(async (filename) => {
      const filePath = path.join(cachePath, filename);
      const text = await fs.readFile(filePath, 'utf8');
      return { name: filename, text };
    }));
    res.json(notes);
  } catch (err) {
    res.status(500).send('Error reading notes');
  }
});

// Створення нової нотатки
app.post('/write', upload.none(), async (req, res) => {
  const noteName = req.body.note_name;
  const noteContent = req.body.note;
  const notePath = path.join(cachePath, noteName);

  if (!noteName || !noteContent) {
    return res.status(400).send('Note name and content are required');
  }

  try {
    await fs.access(notePath);
    return res.status(400).send('Note already exists');
  } catch (err) {
    await fs.writeFile(notePath, noteContent);
    res.status(201).send('Note created');
  }
});

// Відправка HTML форми для завантаження нотатки
app.get('/UploadForm.html', (req, res) => {
  const formPath = path.join(__dirname, 'UploadForm.html');
  res.sendFile(formPath);
});

// Головна сторінка сервера
app.get('/', (req, res) => {
  res.send('Сервер працює!');
});

// Запуск сервера
app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
  console.log(`Cache directory is set to ${path.resolve(cachePath)}`);
});
