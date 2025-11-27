const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/db.json');

// Initialize DB if not exists
if (!fs.existsSync(dbPath)) {
    const initialData = {
        users: [
            { id: 1, name: 'Alex Turner', role: 'Student', email: 'alex@lumina.ai', xp: 850, streak: 5 }
        ],
        courses: [
            { id: 1, title: 'Quantum Physics I', category: 'Science', progress: 75, color: 'blue', image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80' },
            { id: 2, title: 'Calculus for ML', category: 'Math', progress: 30, color: 'purple', image: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80' },
            { id: 3, title: 'React & Node.js', category: 'Programming', progress: 0, color: 'green', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80' }
        ],
        notes: [
            { id: 1, title: 'Physics: Newton Laws', date: '2 mins ago', preview: 'Three laws of motion described by Isaac Newton...', active: true },
            { id: 2, title: 'Calculus Formulas', date: 'Yesterday', preview: 'Derivatives of trigonometric functions...', active: false }
        ]
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
}

class DB {
    constructor() {
        this.data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }

    read() {
        this.data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        return this.data;
    }

    write(data) {
        this.data = data;
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }

    get(collection) {
        this.read();
        return this.data[collection] || [];
    }
}

module.exports = new DB();
