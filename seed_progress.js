const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env variables (mocking process.env for simplicity, pulling directly from .env)
const env = fs.readFileSync('.env', 'utf-8').split('\n');
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

env.forEach(line => {
    if (line.startsWith('SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_ANON_KEY=')) SUPABASE_ANON_KEY = line.split('=')[1].trim();
});

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seedProgress() {
    console.log("Fetching courses...");
    const { data: courses, error: errC } = await supabase.from('courses').select('id');
    if (errC || !courses.length) return console.error("No courses found:", errC);

    console.log("Fetching students...");
    const { data: students, error: errS } = await supabase.from('users').select('id').eq('role', 'student');
    if (errS || !students.length) return console.error("No students found:", errS);

    console.log(`Seeding progress for ${students.length} students...`);
    
    let progressRecords = [];
    
    for (const student of students) {
        // Enrolled courses (3 to 5 courses)
        const shuffled = courses.sort(() => 0.5 - Math.random());
        const enrolled = shuffled.slice(0, Math.floor(Math.random() * 3) + 3);
        
        for (const course of enrolled) {
            const r = Math.random();
            let hours, modIdx, lessIdx, compLessons;

            if (r < 0.2) {
                // Completed
                hours = parseFloat((Math.random() * 10 + 10).toFixed(2));
                modIdx = 3; lessIdx = 0;
                compLessons = [
                    "00000000-0000-0000-0000-000000000001",
                    "00000000-0000-0000-0000-000000000002"
                ];
            } else if (r < 0.7) {
                // Active
                hours = parseFloat((Math.random() * 8 + 1).toFixed(2));
                modIdx = 1; lessIdx = 1;
                compLessons = ["00000000-0000-0000-0000-000000000001"];
            } else {
                // New
                hours = 0.0;
                modIdx = 0; lessIdx = 0;
                compLessons = [];
            }
            
            progressRecords.push({
                user_id: student.id,
                course_id: course.id,
                completed_lessons: compLessons,
                hours_spent: hours,
                current_module_index: modIdx,
                current_lesson_index: lessIdx
            });
        }
    }
    
    console.log(`Inserting ${progressRecords.length} records...`);
    // Insert all
    const { error } = await supabase.from('progress').upsert(progressRecords);
    if (error) {
        console.error("Insert failed:", error);
    } else {
        console.log("Progress seeded successfully!");
    }
}

seedProgress();
