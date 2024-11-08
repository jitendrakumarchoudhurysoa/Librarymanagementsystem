// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Initialize express app
const app = express();
//modify1
app.use(session({
  secret: 'f4e8a4e2a67229b21b849f6f2f9899e5a5de1911a3f617905f89d98b0fa2f9a7e71a889c1f1234fa457e5a1a798b7f0c4a5d19bfc2b2e9cb5d33f82386b59e4d',  // Replace with a strong generated key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // Set to true if using HTTPS in production
}));
//modfiy
app.use(bodyParser.json());
// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files (your HTML, CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',       // Replace with your MySQL host
  user: 'root',            // Replace with your MySQL username
  password: '123456',    // Replace with your MySQL password
  database: 'users_db'      // Replace with your database name
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + db.threadId);
});

// Route to serve the login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Registration route (POST /register)
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  // Check if the email is already registered
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      return res.send('Email already registered');
    }

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) throw err;

      // Insert the new user into the database
      db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
      [name, email, hashedPassword], (err, result) => {
        if (err) throw err;
        res.send('Registration successful');
      });
    });
  });
});
// Login route (POST /login)
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Fetch the user from the database
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.send('User not found');
    }

    const user = results[0];

    // Compare hashed password
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) throw err;

      if (match) {
        res.send('Login successful');
      } else {
        res.send('Invalid credentials');
      }
    });
  });
});
// Add a book (POST /add-book)
// Add a book (POST /add-book)
app.post('/add-book', (req, res) => {
  const { title, genre } = req.body;

  console.log("Received data:", req.body);  // Add this line

  if (!title || !genre) {
      return res.status(400).send('Title and genre are required');
  }

  // Insert the new book into the database
  db.query('INSERT INTO books (title, genre) VALUES (?, ?)', 
  [title, genre], (err, result) => {
      if (err) throw err;
      res.status(200).send('Book added successfully');
  });
});


// Get all books (GET /books)
app.get('/books', (req, res) => {
  db.query('SELECT * FROM books', (err, results) => {
      if (err) throw err;
      res.json(results);
  });
});
// Get all books from the database
app.get('/get-books', (req, res) => {
  db.query('SELECT * FROM books', (err, results) => {
      if (err) throw err;
      res.json(results);
  });
});
app.delete('/delete-book/:id', (req, res) => {
  const { id } = req.params;
  console.log("Deleting book with ID:", id); // Log ID to check if it's valid

  if (!id) {
      return res.status(400).send('Book ID is required');
  }

  db.query('DELETE FROM books WHERE id = ?', [id], (err, result) => {
      if (err) {
          console.error('Error deleting book:', err);
          return res.status(500).send('Error deleting book');
      }
      if (result.affectedRows === 0) {
          return res.send('Book not found');
      }
      res.send('Book deleted successfully');
  });
});


app.get('/user-info', (req, res) => {
  const userId = req.session.userId;  // Assuming userId is stored in session after login
  
  if (userId) {
      const query = 'SELECT name FROM users WHERE id = ?';  // Replace 'username' and 'users' with your actual table/field names
      db.query(query, [userId], (err, results) => {
          if (err) {
              return res.status(500).json({ error: 'Failed to fetch user info' });
          }

          if (results.length > 0) {
              res.json({ username: results[0].username });
          } else {
              res.status(404).json({ error: 'User not found' });
          }
      });
  } else {
      res.status(401).json({ error: 'User not authenticated' });
  }
});
// Fetch all registered users
app.get('/get-users', (req, res) => {
  const query = 'SELECT id,name, email FROM users';
  db.query(query, (error, results) => {
      if (error) {
          console.error('Error fetching users:', error);
          res.status(500).send('Error fetching users');
      } else {
          res.json(results);
      }
  });
});





// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
