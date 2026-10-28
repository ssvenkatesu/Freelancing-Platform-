import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "../models/question.model.js";

dotenv.config();

const sampleQuestions = [
  // JavaScript
  {
    category: "JavaScript",
    difficulty: "easy",
    question: "Which keyword is used to declare a block-scoped variable in modern JavaScript?",
    options: ["var", "let", "def", "global"],
    correctAnswer: 1,
    explanation: "'let' and 'const' declare block-scoped variables in modern ES6 JavaScript.",
  },
  {
    category: "JavaScript",
    difficulty: "medium",
    question: "What is the result of typeof NaN in JavaScript?",
    options: ["undefined", "null", "number", "object"],
    correctAnswer: 2,
    explanation: "In JavaScript, NaN (Not-a-Number) is technically of type 'number'.",
  },
  {
    category: "JavaScript",
    difficulty: "medium",
    question: "What does Array.prototype.map() return?",
    options: ["A single accumulated value", "A new array with transformed elements", "The original array modified in place", "A boolean value"],
    correctAnswer: 1,
    explanation: "map() creates a new array populated with the results of calling a provided function on every element in the calling array.",
  },
  {
    category: "JavaScript",
    difficulty: "hard",
    question: "What is the event loop primary responsibility in JavaScript?",
    options: ["To parse HTML into DOM trees", "To manage memory garbage collection", "To execute call stack tasks and monitor the callback queue", "To compile JavaScript bytecode into machine code"],
    correctAnswer: 2,
    explanation: "The event loop continuously checks the call stack and moves pending callbacks from the queue to the stack when empty.",
  },

  // React
  {
    category: "React",
    difficulty: "easy",
    question: "Which Hook is used to manage local state in a React functional component?",
    options: ["useEffect", "useReducer", "useState", "useContext"],
    correctAnswer: 2,
    explanation: "useState is the built-in Hook for managing state within functional components.",
  },
  {
    category: "React",
    difficulty: "medium",
    question: "When does the cleanup function returned by useEffect execute?",
    options: ["Only when the component mounts", "Before the component re-renders or unmounts", "Only on server side rendering", "Never unless manually invoked"],
    correctAnswer: 1,
    explanation: "The effect cleanup function runs before the component unmounts and before subsequent effect re-runs.",
  },
  {
    category: "React",
    difficulty: "hard",
    question: "What is the main benefit of React.useMemo?",
    options: ["To mutate DOM nodes directly", "To memoize expensive calculations between renders", "To handle HTTP API calls", "To create global Redux stores"],
    correctAnswer: 1,
    explanation: "useMemo caches the result of a calculation between re-renders unless specified dependencies change.",
  },

  // Node.js
  {
    category: "Node.js",
    difficulty: "easy",
    question: "Which built-in Node.js module handles file system operations?",
    options: ["http", "path", "fs", "url"],
    correctAnswer: 2,
    explanation: "The 'fs' (file system) module allows interacting with the file system on disk.",
  },
  {
    category: "Node.js",
    difficulty: "medium",
    question: "What is the primary architectural model of Node.js?",
    options: ["Multi-threaded synchronous blocking I/O", "Single-threaded non-blocking event-driven I/O", "Process per request model", "Pre-fork worker pool model"],
    correctAnswer: 1,
    explanation: "Node.js uses an event-driven, non-blocking I/O model running on a single main thread via libuv.",
  },
  {
    category: "Node.js",
    difficulty: "hard",
    question: "What does process.nextTick() do in Node.js?",
    options: ["Schedules a callback to run on the next event loop tick before I/O events", "Sets a 1-second delay", "Launches a new worker thread", "Restarts the server process"],
    correctAnswer: 0,
    explanation: "process.nextTick() adds the callback to the nextTick queue, which is processed immediately after the current operation finishes before the event loop continues.",
  },

  // Python
  {
    category: "Python",
    difficulty: "easy",
    question: "Which data structure in Python is immutable?",
    options: ["List", "Dictionary", "Tuple", "Set"],
    correctAnswer: 2,
    explanation: "Tuples are immutable sequence data structures in Python; their elements cannot be modified after creation.",
  },
  {
    category: "Python",
    difficulty: "medium",
    question: "What is the output of [x**2 for x in range(3)]?",
    options: ["[1, 4, 9]", "[0, 1, 4]", "[0, 1, 2]", "[1, 2, 3]"],
    correctAnswer: 1,
    explanation: "range(3) yields 0, 1, 2. Squaring each produces [0, 1, 4].",
  },

  // SQL & MongoDB
  {
    category: "SQL",
    difficulty: "medium",
    question: "Which SQL clause is used to filter aggregated group data?",
    options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
    correctAnswer: 1,
    explanation: "HAVING is used to filter groups created by GROUP BY, whereas WHERE filters individual rows before grouping.",
  },
  {
    category: "MongoDB",
    difficulty: "medium",
    question: "Which Mongoose method updates a document and returns the newly updated document?",
    options: ["updateOne()", "findByIdAndUpdate(id, update, { new: true })", "save()", "update()"],
    correctAnswer: 1,
    explanation: "Passing { new: true } to findByIdAndUpdate returns the modified document rather than the original.",
  },
];

const seedQuestions = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/freelancePlatform";
    console.log("🌱 Connecting to MongoDB for question bank seeding:", mongoUri);
    await mongoose.connect(mongoUri);

    for (const q of sampleQuestions) {
      const existing = await Question.findOne({ question: q.question });
      if (!existing) {
        await Question.create(q);
        console.log(`✅ Added question: [${q.category}] ${q.question.substring(0, 40)}...`);
      }
    }

    console.log("🎉 Question bank seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Question seeding error:", err);
    process.exit(1);
  }
};

seedQuestions();
