/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 2 Content Population Script (Phase 11I-C2)
 *
 * Populates all 9 topics of Module 2 ("Node.js Fundamentals") using the
 * authoritative Course Creator API:
 *   PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content
 *
 * Adheres strictly to:
 * - Existing Topic schema (content.explanation, content.sections, codeExamples, importantPoints, externalReferences)
 * - Self-contained, beginner-friendly, RAG-ready educational material
 * - No YouTube URLs (videos remain null)
 * - No images (images remain empty)
 * - No assessments
 * - Course remains Draft
 * - Modules 1 and 3-8 remain untouched
 */

import 'dotenv/config';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const MODULE_2_ID = '6abe9dc6f15c2b4f6008ac26';

const CREATOR_EMAIL = 'faculty@learnsphere.io';
const CREATOR_PASSWORD = 'Str0ng!Faculty#Secret2026';

export const module2TopicsContent = [
  // =========================================================================
  // TOPIC 1: What Is Node.js?
  // ID: 6abe9dc6f15c2b4f6008ac27
  // =========================================================================
  {
    topicId: '6abe9dc6f15c2b4f6008ac27',
    title: 'What Is Node.js?',
    content: {
      explanation: `For the first fifteen years of its existence, the JavaScript programming language could only run inside one place: a web browser like Chrome, Firefox, or Safari. Developers used JavaScript exclusively on the frontend to animate menus, validate forms, and respond to button clicks, while backend servers had to be written in other languages such as PHP, Java, Python, or Ruby.

Created by Ryan Dahl in 2009, Node.js changed web development by taking Google Chrome's fast V8 JavaScript engine out of the browser and embedding it inside a standalone program that can run directly on any computer or server operating system.

It is essential to understand what Node.js actually is:
• JavaScript is the programming language (the syntax rules, variables, functions, and loops you write).
• V8 is the JavaScript engine (the C++ software component that compiles and executes JavaScript code).
• Node.js is a JavaScript runtime environment built around the V8 engine, combined with additional system APIs for networking, file system access, operating system processes, and cryptography.

Node.js is NOT a programming language, and it is NOT a web framework. Instead, it is the environment that enables JavaScript code to run outside the browser on backend servers, command-line tools, and desktop utilities.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Define Node.js accurately as an open-source, cross-platform JavaScript runtime environment.
2. Clearly distinguish between JavaScript (the language), V8 (the engine), and Node.js (the runtime environment).
3. Compare browser JavaScript environments with the Node.js server environment.
4. Explain how Node.js relates to V8 and npm, and identify common backend use cases for Node.js.`,
        },
        {
          order: 1,
          heading: 'JavaScript vs. V8 vs. Node.js',
          body: `Beginners often blur the lines between JavaScript, V8, and Node.js. Let us separate them clearly:

1. JavaScript (The Programming Language):
JavaScript (standardized as ECMAScript) defines the grammar and core features of the code you write—such as variables (const, let), data types (strings, objects, arrays), functions, and Promises.

2. V8 (The JavaScript Engine):
Computers only understand machine code (binary instructions for the processor), not raw JavaScript text. V8 is the open-source engine developed by Google in C++ that reads JavaScript source code, compiles it directly into fast native machine code (Just-In-Time compilation), and manages memory allocation and garbage collection.

3. Node.js (The Runtime Environment):
By itself, the V8 engine only knows how to calculate math, manipulate objects, and run standard JavaScript logic. V8 has no built-in concept of opening a file on a hard drive or listening for network requests on a port. Node.js wraps the V8 engine together with system-level libraries (like libuv) so your JavaScript code can read files, open network sockets, talk to databases, and run as a full backend server.`,
        },
        {
          order: 2,
          heading: 'Browser JavaScript vs. Node.js JavaScript',
          body: `Although both environments execute the same core JavaScript language, they provide completely different host APIs tailored to their jobs:

In the Web Browser (Frontend):
• Purpose: Render visual user interfaces and handle user interactions.
• Provided Objects: 'window', 'document' (the DOM), 'localStorage', and browser events.
• Security Sandbox: Restricted from reading arbitrary files on the user's computer or opening network listening ports for security reasons.

In Node.js (Backend / System):
• Purpose: Process network requests, interact with databases, manage files, and run automation scripts.
• Provided Objects & Modules: 'process', 'Buffer', 'node:fs' (File System), 'node:http' (HTTP networking), 'node:path', and 'node:crypto'.
• Missing Browser Objects: There is NO 'window' and NO 'document' in Node.js because there is no visual webpage or DOM tree on a server.`,
        },
        {
          order: 3,
          heading: 'Why Node.js Is Popular for Backend Development & Relationship with npm',
          body: `Node.js became one of the most widely adopted technologies for backend engineering for several practical reasons:

1. Unified Language Across the Stack:
Teams can write both their frontend user interface and their backend server logic in JavaScript or TypeScript, sharing data validation logic, utility functions, and developer skills.

2. High Performance for I/O-Heavy Workloads:
Backend servers spend most of their time waiting for Input/Output (I/O)—waiting for a database query to return, waiting for a file to be read, or waiting for an external API response. Node.js uses non-blocking, event-driven I/O so a single server process can handle thousands of concurrent connections efficiently.

3. Relationship with npm (Node Package Manager):
When you install Node.js, it comes bundled with npm—the world's largest software registry. Through npm, backend developers can install battle-tested packages for web servers (Express), database modeling (Mongoose), input validation, and security headers instead of reinventing every utility from scratch.

Common Backend Uses of Node.js:
• RESTful JSON APIs for web and mobile applications
• Real-time applications (chat servers, live notifications, collaborative tools)
• Command-line interface (CLI) developer tools and build scripts
• Microservices and API gateways`,
        },
        {
          order: 4,
          heading: 'Step-by-Step Real-World Request Flow in Node.js',
          body: `Here is how a Node.js backend processes a typical request in a real application:

Step 1: A Node.js process is started on a server and listens on a network port (for example, port 5000).
Step 2: A client (such as a web browser) sends an HTTP GET request to fetch a list of courses.
Step 3: The Node.js runtime receives the network packets through its operating system networking binding and creates JavaScript Request and Response objects.
Step 4: Your JavaScript application code executes inside the V8 engine, inspects the request URL, and sends an asynchronous query to a MongoDB database.
Step 5: While MongoDB retrieves the records, Node.js remains free to accept requests from other users rather than freezing.
Step 6: Once MongoDB returns the data, Node.js formats the result as a JSON string and sends the HTTP response back to the client.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Calling Node.js a Programming Language or Framework:
Mistake: Saying "I programmed this in the Node.js language" or "Node.js is a backend framework like Express."
Reality: JavaScript is the language; Express is a web framework; Node.js is the runtime environment that executes JavaScript outside the browser.

2. Trying to Use 'document' or 'window' in Node.js:
Mistake: Copying browser code like document.getElementById('app') or window.alert('Hello') into a Node.js backend script.
Reality: Node.js runs on a server without a browser screen or DOM. Referencing 'document' or 'window' in Node.js throws a ReferenceError.

3. Assuming Browser Security Restrictions Apply to Node.js Scripts:
Mistake: Running untrusted third-party scripts in Node.js assuming they are sandboxed like a webpage.
Reality: A Node.js script has the same operating system permissions as the user running it—it can read, modify, or delete local files and make outbound network requests.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task:
Compare the browser environment and the Node.js environment by answering these three questions in your study notes:
1. If you run console.log(typeof window) inside your browser's Developer Tools Console, it prints "object". What will it print if you run it inside a Node.js script, and why?
2. For each of the following tasks, state whether it belongs in Browser JavaScript, Node.js, or Both:
   a) Changing the background color of a button when clicked.
   b) Reading a configuration file from the server's hard drive.
   c) Sorting an array of student names alphabetically using Array.prototype.sort().
3. Explain in one sentence each: What is JavaScript, what is V8, and what is Node.js?`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• JavaScript is a programming language; V8 is Google's high-performance JavaScript engine; Node.js is a runtime environment built on V8 that executes JavaScript outside the browser.
• Node.js provides server-side system APIs such as file system access (node:fs), networking (node:http), and environment inspection (process).
• Browser globals like 'window' and 'document' do not exist in Node.js.
• Node.js is widely used to build fast, scalable backend APIs, real-time services, and command-line utilities, supported by the npm package ecosystem.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Running JavaScript Outside the Browser with Node.js System Info',
        language: 'javascript',
        code: `// intro_node.js - A runnable Node.js script inspecting runtime capabilities
import os from 'node:os';

// 1. Standard JavaScript works identically in Node.js
const courseTitle = 'Backend Development with Node.js';
console.log('Course:', courseTitle.toUpperCase());

// 2. Browser globals like 'window' and 'document' do not exist in Node.js
console.log('Is window defined?', typeof window !== 'undefined');
console.log('Is document defined?', typeof document !== 'undefined');

// 3. Node.js provides system-level objects and modules unavailable in browsers
console.log('Node.js Process Platform:', process.platform);
console.log('System CPU Architecture:', os.arch());
console.log('Current Working Directory:', process.cwd());`,
        explanation: `This runnable script demonstrates both standard JavaScript string manipulation and Node.js-specific capabilities. First, it uses standard JavaScript (.toUpperCase()). Next, it confirms that browser globals ('window' and 'document') are undefined. Finally, it accesses Node.js's built-in 'process' global and 'node:os' module to inspect the host machine—operations a browser script cannot perform.

Expected Output (values for platform, architecture, and directory will reflect your machine):
Course: BACKEND DEVELOPMENT WITH NODE.JS
Is window defined? false
Is document defined? false
Node.js Process Platform: win32
System CPU Architecture: x64
Current Working Directory: C:\\projects\\learnsphere-demo`,
      },
    ],
    importantPoints: [
      'JavaScript is the programming language; V8 is the engine that compiles and runs JavaScript; Node.js is the runtime environment built around V8.',
      'Node.js is a runtime environment, not a programming language and not a web framework.',
      'Node.js allows JavaScript to run outside the web browser on servers and desktop operating systems.',
      'Browser-specific objects like window and document do not exist in Node.js; instead, Node.js provides system modules like node:fs, node:http, and process.',
      'npm (Node Package Manager) is bundled with Node.js and provides access to reusable open-source packages.',
      'Node.js excels at building I/O-bound backend services such as REST APIs and real-time servers.',
    ],
    externalReferences: [
      {
        title: 'Node.js Official Learn Guide: Introduction to Node.js',
        url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
        source: 'Node.js Official Docs',
      },
      {
        title: 'Node.js Official Learn Guide: Differences Between Node.js and the Browser',
        url: 'https://nodejs.org/en/learn/getting-started/differences-between-nodejs-and-the-browser',
        source: 'Node.js Official Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 2: Node.js Runtime and Architecture
  // ID: 6abe9dc6f15c2b4f6008ac28
  // =========================================================================
  {
    topicId: '6abe9dc6f15c2b4f6008ac28',
    title: 'Node.js Runtime and Architecture',
    content: {
      explanation: `When developers first learn how Node.js works internally, they often hear the phrase: "Node.js runs JavaScript on a single thread."

This immediately raises an important question: If Node.js executes JavaScript on a single main thread, how can a single Node.js backend server handle thousands of students loading courses, submitting quizzes, and logging in at the exact same time without making everyone wait in a slow single-file line?

The answer lies in the Node.js Runtime Architecture: an event-driven, non-blocking Input/Output (I/O) model powered by the V8 engine, the Call Stack, Node.js C++ APIs, the libuv library, and the Event Loop.

Understanding how Node.js delegates slow waiting tasks (like database queries, file reads, and network calls) to the underlying operating system while keeping the main JavaScript thread free is the key to writing fast, responsive backend servers.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Identify the main architectural building blocks of the Node.js runtime: V8, Call Stack, Node.js APIs (libuv), Callback Queue, and the Event Loop.
2. Explain what "single-threaded JavaScript execution" actually means without falling for the myth that Node.js can only do one thing at a time.
3. Contrast blocking I/O with non-blocking asynchronous I/O.
4. Trace the step-by-step execution flow of a program containing both synchronous code and asynchronous operations.
5. Explain why CPU-intensive tasks block the Event Loop and degrade server responsiveness.`,
        },
        {
          order: 1,
          heading: 'Core Components of the Node.js Runtime',
          body: `The Node.js runtime is composed of several cooperating layers:

1. The V8 JavaScript Engine & Call Stack:
V8 compiles and executes your JavaScript code. It maintains a Call Stack—a data structure that tracks which JavaScript function is currently running. Because JavaScript has a single Call Stack on its main thread, only one JavaScript statement executes on that stack at any exact nanosecond.

2. Node.js APIs & libuv (The Asynchronous Engine):
When your JavaScript code asks to perform an I/O operation—such as querying a database over the network, reading a file from disk, or setting a timer—Node.js does NOT force the V8 Call Stack to sit idle and wait. Instead, Node.js hands that task off to libuv (a C library built into Node.js).
• For network I/O, libuv uses the operating system's native non-blocking network kernel facilities.
• For file system operations and heavy cryptography, libuv uses a background C++ Worker Thread Pool outside the main JavaScript thread.

3. The Task / Callback Queues:
When an asynchronous background operation finishes (for example, the database returns query results), its completion handler (callback or Promise resolution) is placed into a waiting queue rather than interrupting the currently running JavaScript code.

4. The Event Loop:
The Event Loop is an endless coordinator loop that constantly watches both the Call Stack and the queues. Whenever the Call Stack becomes completely empty, the Event Loop picks the next completed task from the queue and pushes its callback onto the Call Stack for V8 to execute.`,
        },
        {
          order: 2,
          heading: 'Dispelling the Myth: "Single-Threaded" vs. Concurrent I/O',
          body: `It is inaccurate to say "Node.js is single-threaded, so it can only do one thing at a time."

Here is the accurate architectural distinction:
• Your JavaScript code runs on a single main thread (one Call Stack).
• However, I/O operations (network requests, database queries, disk reads, timers) run concurrently in the background via the operating system kernel or libuv's worker pool!

Real-World Analogy — The Efficient Coffee Shop Barista:
Imagine a coffee shop with one cashier/expediter at the counter (the main JavaScript thread) and several automated espresso machines (the OS kernel / libuv background workers):
• Blocking Model: Customer 1 orders a latte. The cashier stands frozen staring at the espresso machine for 2 full minutes until the drink is done before even saying hello to Customer 2. The line backs up out the door.
• Node.js Non-Blocking Event-Driven Model: Customer 1 orders a latte. The cashier presses start on Espresso Machine A (takes 1 second) and immediately takes Customer 2's order and starts Espresso Machine B. When Machine A dings (an event!), the cashier hands the finished latte to Customer 1. One cashier smoothly serves dozens of customers concurrently because they never stand idle waiting for a machine.`,
        },
        {
          order: 3,
          heading: 'Step-by-Step Execution Flow Trace',
          body: `Let us trace how the Node.js runtime executes a script with both synchronous and asynchronous steps:

Step 1: Node.js starts executing your file from top to bottom on the V8 Call Stack.
Step 2: It encounters console.log("1. Start"). Since this is synchronous, V8 executes it immediately and prints "1. Start".
Step 3: It encounters setTimeout(callback, 100) or an asynchronous file read. Node.js registers the timer/request with the background Node.js APIs (libuv) and immediately removes the setup call from the Call Stack without waiting.
Step 4: V8 moves to the next line: console.log("2. Continuing synchronous work"). It prints this immediately while the timer or I/O is still running in the background.
Step 5: The main script reaches the end of the file. The Call Stack is now empty.
Step 6: When the 100ms timer expires (or the file read finishes), libuv places the callback into the queue.
Step 7: The Event Loop sees that the Call Stack is empty, moves the callback onto the Call Stack, and V8 executes console.log("3. Async callback finished").`,
        },
        {
          order: 4,
          heading: 'Why CPU-Heavy Work Can Block the Event Loop',
          body: `Because all JavaScript code shares a single Call Stack on the main thread, there is one golden rule in Node.js backend development:

"Never block the Event Loop with long-running synchronous JavaScript."

Why?
• Waiting for a database query is I/O-bound: Node.js offloads the wait to the operating system, so the Call Stack is free to serve other users.
• Calculating 50 million prime numbers in a 'for' loop, parsing a massive 500MB JSON string synchronously, or running fs.readFileSync() on a huge file is CPU-bound / synchronous: V8's Call Stack is busy running that loop line-by-line.

While the Call Stack is occupied for 5 seconds doing heavy math, the Event Loop cannot pick up any new incoming HTTP requests, cannot process finished database callbacks, and cannot respond to health checks. Every connected user experiences a frozen server until the loop finishes.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Using Synchronous '*Sync' Methods Inside HTTP Request Handlers:
Mistake: Calling fs.readFileSync() or crypto.pbkdf2Sync() inside an API endpoint that serves live users.
Reality: Synchronous methods freeze the entire Node.js thread until they complete, blocking all other users' requests. Only use '*Sync' methods once at initial server startup (if at all); always use asynchronous methods inside request handlers.

2. Assuming Node.js Is Ideal for Heavy Video Encoding or Machine Learning Training on the Main Thread:
Mistake: Running multi-second CPU calculations directly inside a web route handler.
Reality: Heavy CPU work starves the Event Loop. Such workloads should be offloaded to Node.js Worker Threads or separate background job services.

3. Expecting Asynchronous Callbacks to Run Before Synchronous Code Finishes:
Mistake: Assuming setTimeout(fn, 0) will interrupt the very next line of synchronous code.
Reality: The Event Loop can only push a queued callback onto the Call Stack after ALL currently executing synchronous code has finished and the Call Stack is completely empty.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Trace & Predict Exercise:
Without running the code first, predict the exact order of lines printed to the terminal by the following snippet:

console.log('Step A: Request received');
setTimeout(() => {
  console.log('Step B: Database query finished (0ms timer)');
}, 0);
console.log('Step C: Preparing response metadata');

Questions to answer:
1. Why does 'Step C' print before 'Step B', even though the timer delay is set to 0 milliseconds?
2. What would happen to 'Step B' if we placed a synchronous while-loop after 'Step C' that ran for 3 full seconds?`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• The Node.js runtime combines the V8 JavaScript engine, Node.js system APIs, libuv, callback queues, and the Event Loop.
• JavaScript code executes on a single main thread (one Call Stack), while I/O operations (network, database, file system) are offloaded asynchronously to the OS kernel or libuv worker pool.
• This non-blocking, event-driven architecture enables a single Node.js server to handle thousands of concurrent I/O-bound requests with low memory overhead.
• Long-running CPU-intensive JavaScript calculations or synchronous I/O calls block the Call Stack, stalling the Event Loop for all connected clients.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Observing the Call Stack, Asynchronous Offloading, and the Event Loop',
        language: 'javascript',
        code: `// event_loop_demo.js - Demonstrating non-blocking execution order in Node.js
import fs from 'node:fs';

console.log('1. [Call Stack] Script execution starts synchronously.');

// Offload a timer to Node.js APIs (libuv)
setTimeout(() => {
  console.log('4. [Event Loop -> Call Stack] Timer callback executed after I/O phase.');
}, 50);

// Offload an asynchronous directory read to libuv worker pool
fs.readdir('.', (err, files) => {
  if (err) {
    console.error('Error reading directory:', err.message);
    return;
  }
  console.log(\`3. [Event Loop -> Call Stack] Async directory read complete (found \${files.length} items).\`);
});

console.log('2. [Call Stack] Synchronous code finishes without waiting for I/O!');`,
        explanation: `When you run this script with 'node event_loop_demo.js', V8 executes statement 1 on the Call Stack. It then hands off the 50ms timer and the fs.readdir disk operation to libuv in the background and immediately executes statement 2. Once the Call Stack is empty, the Event Loop picks up the completed directory read callback (statement 3) and then the 50ms timer callback (statement 4).

Expected Output:
1. [Call Stack] Script execution starts synchronously.
2. [Call Stack] Synchronous code finishes without waiting for I/O!
3. [Event Loop -> Call Stack] Async directory read complete (found 12 items).
4. [Event Loop -> Call Stack] Timer callback executed after I/O phase.`,
      },
    ],
    importantPoints: [
      'Node.js executes JavaScript on a single main thread using the V8 Call Stack, but offloads I/O tasks to the operating system and libuv.',
      'Non-blocking I/O means the main thread initiates an operation (like a database query) and immediately moves on to serve other requests without waiting.',
      'The Event Loop monitors the Call Stack and callback queues, pushing completed asynchronous callbacks onto the Call Stack only when it is empty.',
      'Node.js is exceptionally fast at handling many concurrent I/O-bound requests (network, database, disk).',
      'CPU-heavy synchronous work (large loops, synchronous file reads) blocks the Call Stack and prevents the Event Loop from serving any other requests.',
    ],
    externalReferences: [
      {
        title: 'Node.js Official Guide: Overview of Blocking vs Non-Blocking',
        url: 'https://nodejs.org/en/learn/asynchronous-work/overview-of-blocking-vs-non-blocking',
        source: 'Node.js Official Docs',
      },
      {
        title: 'Node.js Official Guide: Don\'t Block the Event Loop',
        url: 'https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop',
        source: 'Node.js Official Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 3: Installing Node.js and npm
  // ID: 6abe9dc7f15c2b4f6008ac29
  // =========================================================================
  {
    topicId: '6abe9dc7f15c2b4f6008ac29',
    title: 'Installing Node.js and npm',
    content: {
      explanation: `Before you can write and run backend applications on your computer, you need two essential command-line tools installed on your operating system: Node.js (the runtime that executes your JavaScript files) and npm (the Node Package Manager used to manage project libraries).

Fortunately, you do not need to install them separately. The official Node.js installer automatically includes npm out of the box and configures your system PATH so both the 'node' and 'npm' commands are available inside your terminal.

In this topic, you will learn how to choose the right Node.js release channel, verify your installation using Windows-friendly terminal commands, create a clean project folder from the command line, and execute your very first '.js' backend script.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Choose between the LTS (Long-Term Support) and Current release channels when downloading Node.js.
2. Explain how npm is installed alongside Node.js.
3. Use fundamental Windows terminal commands (PowerShell or Command Prompt) to navigate folders and verify tool versions.
4. Run ` + '`node --version`' + ` and ` + '`npm --version`' + ` and interpret their output.
5. Create a project directory and execute a JavaScript file using the ` + '`node`' + ` command.`,
        },
        {
          order: 1,
          heading: 'Choosing and Installing Node.js (LTS vs. Current)',
          body: `When you visit the official Node.js website (https://nodejs.org), you are presented with two main download options:

1. LTS (Long-Term Support) — Recommended for Almost Everyone:
• LTS releases prioritize stability, reliability, and long-term security updates.
• Production backend servers and enterprise teams standardize on LTS versions because they are thoroughly tested and guaranteed to receive critical bug and security fixes for an extended maintenance window.

2. Current — For Testing Experimental Features:
• The Current release channel includes the newest language and runtime features under active development, but has a shorter support lifecycle.

How Installation Works on Windows:
1. Download the Windows Installer (.msi) for the LTS release from https://nodejs.org.
2. Run the installer and accept the default options, ensuring "npm package manager" and "Add to PATH" remain selected.
3. Adding Node.js to your system PATH allows Windows PowerShell and Command Prompt to recognize the 'node' and 'npm' commands from any folder on your computer.
4. After installation finishes, always close and reopen your terminal window so the updated PATH environment variable takes effect.`,
        },
        {
          order: 2,
          heading: 'Essential Windows Terminal Commands for Backend Developers',
          body: `As a backend developer, you will regularly use a terminal—such as Windows PowerShell, Windows Terminal, or Command Prompt (cmd.exe)—to start servers and run scripts.

Here are the core commands you need:

• Check your current folder path:
  cd
  (Prints the full path of the directory you are currently inside).

• Create a new folder (Make Directory):
  mkdir my-backend-app
  (Creates a new folder named 'my-backend-app' inside your current location).

• Enter a folder (Change Directory):
  cd my-backend-app
  (Moves your terminal session into the 'my-backend-app' folder).

• Move up one folder level (Parent Directory):
  cd ..
  (Moves back out to the parent folder).

• List files in the current folder:
  dir
  (Displays all files and subfolders inside the current directory on Windows).`,
        },
        {
          order: 3,
          heading: 'Verifying Node.js and npm Versions',
          body: `Once you open a fresh PowerShell or Command Prompt window, verify that both tools are installed and accessible by running two version-check commands:

1. Check the Node.js Runtime Version:
Command:
  node --version
  (or shorthand: node -v)
What it does: Asks the Node.js binary to print its installed semantic version number and exit.
Conceptual Expected Output:
  vX.Y.Z
  (For example, a version string starting with 'v' followed by major, minor, and patch numbers).

2. Check the npm CLI Version:
Command:
  npm --version
  (or shorthand: npm -v)
What it does: Asks the bundled Node Package Manager CLI to report its installed version.
Conceptual Expected Output:
  A.B.C
  (A three-part version number confirming npm is ready to install packages).

If either command prints "'node' is not recognized as an internal or external command", it means either Node.js is not installed or your terminal window needs to be restarted so Windows reloads the system PATH.`,
        },
        {
          order: 4,
          heading: 'Step-by-Step: Creating a Project Folder and Running a .js File',
          body: `Let us walk through creating a project directory and running a JavaScript file from start to finish on Windows:

Step 1: Open Windows PowerShell or Command Prompt and create a workspace folder:
  mkdir hello-node
  cd hello-node

Step 2: Open the 'hello-node' folder in your code editor (such as Visual Studio Code) and create a new file named 'app.js'.
(Be careful that Windows File Explorer does not secretly name the file 'app.js.txt'—enable "File name extensions" in Windows Explorer View settings).

Step 3: Write a simple JavaScript program inside 'app.js' and save the file.

Step 4: In your terminal (making sure your prompt is inside the 'hello-node' folder), run the file by passing its filename to the 'node' command:
  node app.js

Step 5: Observe the output printed directly in your terminal window. Once the script finishes executing its last line, Node.js automatically exits and returns you to the command prompt.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Typing JavaScript Code Directly Into the Windows Command Prompt:
Mistake: Opening PowerShell, typing const x = 5; directly at the C:\\Users\\You> prompt, and getting a Windows syntax error.
Reality: Usually you save your code in a '.js' file and run 'node filename.js'. (If you want an interactive JavaScript prompt, you must first type 'node' by itself to enter the Node.js REPL, and press Ctrl + C twice to exit).

2. Running 'node app.js' from the Wrong Directory:
Mistake: Saving 'app.js' on your Desktop, but running 'node app.js' while your terminal is still in 'C:\\Users\\You', resulting in "Error: Cannot find module".
Reality: Always use 'cd' to navigate into the exact folder containing your '.js' file (and verify with 'dir') before running 'node app.js'.

3. Hidden '.txt' File Extensions on Windows:
Mistake: Creating 'app.js' in Notepad, which saves it as 'app.js.txt'.
Reality: Check with the 'dir' command in your terminal to confirm the file is genuinely named 'app.js'.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Hands-On Terminal Exercise:
1. Open your terminal (PowerShell or Command Prompt) and run:
   node --version
   npm --version
2. Create a new practice folder named 'node-practice' and navigate into it:
   mkdir node-practice
   cd node-practice
3. Create a file named 'welcome.js' inside 'node-practice' that calculates the sum of two numbers and prints a greeting along with process.version.
4. Execute the file using:
   node welcome.js
5. Confirm that the greeting, the calculated sum, and your installed Node.js version string are printed to the terminal.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• Installing the Node.js LTS (Long-Term Support) release automatically installs both the 'node' runtime and the 'npm' package manager.
• Use 'node --version' and 'npm --version' in the terminal to verify that both tools are installed and on your system PATH.
• Essential Windows terminal commands include 'mkdir' (create folder), 'cd' (change folder), 'cd ..' (go up one folder), and 'dir' (list files).
• To execute a JavaScript file outside the browser, navigate to its folder and run 'node <filename>.js'.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Windows Terminal Session: Verifying Versions and Running a Script',
        language: 'powershell',
        code: `# 1. Verify that Node.js and npm are installed
PS C:\\Users\\Student> node --version
# Expected output format: vX.Y.Z (your installed Node.js LTS version)

PS C:\\Users\\Student> npm --version
# Expected output format: A.B.C (your installed npm version)

# 2. Create a new project directory and move into it
PS C:\\Users\\Student> mkdir hello-node
PS C:\\Users\\Student> cd hello-node

# 3. List directory contents after creating app.js in your editor
PS C:\\Users\\Student\\hello-node> dir
# Confirm that app.js is listed in the directory

# 4. Execute the JavaScript file with Node.js
PS C:\\Users\\Student\\hello-node> node app.js`,
        explanation: `This sequence shows the exact commands a developer runs in Windows PowerShell (or Command Prompt). First, 'node --version' and 'npm --version' confirm that both executables are available on the system PATH. Next, 'mkdir' creates a dedicated project directory and 'cd' navigates into it. Finally, 'node app.js' tells the Node.js runtime to load, compile, and execute 'app.js'.`,
      },
      {
        title: 'First Runnable Node.js Script (app.js)',
        language: 'javascript',
        code: `// app.js - Run this file from your terminal using: node app.js

const learnerName = 'Backend Learner';
const modulesCompleted = 1;
const nextModule = 'Node.js Fundamentals';

console.log(\`Welcome, \${learnerName}!\`);
console.log(\`You have completed \${modulesCompleted} module and started: \${nextModule}.\`);
console.log(\`Running on Node.js runtime version: \${process.version}\`);`,
        explanation: `When saved as 'app.js' inside your project directory and executed with 'node app.js', this script runs directly on your operating system and prints three lines to your terminal window. Note how 'process.version' dynamically reads the installed Node.js version string at runtime.

Conceptual Expected Terminal Output:
Welcome, Backend Learner!
You have completed 1 module and started: Node.js Fundamentals.
Running on Node.js runtime version: vX.Y.Z`,
      },
    ],
    importantPoints: [
      'Always prefer the LTS (Long-Term Support) version of Node.js for stable learning and production backend work.',
      'npm (Node Package Manager) is automatically installed alongside Node.js—no separate installation is required.',
      'Use node --version and npm --version to verify that both commands are available in your terminal.',
      'Use mkdir to create a directory, cd to enter it, and dir (on Windows) to list files in the current directory.',
      'Execute any JavaScript file in the terminal by navigating to its folder and running node <filename>.js.',
    ],
    externalReferences: [
      {
        title: 'Node.js Official Website: Download & Installation Guide',
        url: 'https://nodejs.org/en/download',
        source: 'Node.js Official Docs',
      },
      {
        title: 'Node.js Official Learn Guide: How to Run Node.js Scripts from the Command Line',
        url: 'https://nodejs.org/en/learn/command-line/run-nodejs-scripts-from-the-command-line',
        source: 'Node.js Official Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 4: npm and package.json
  // ID: 6abe9dc7f15c2b4f6008ac2a
  // =========================================================================
  {
    topicId: '6abe9dc7f15c2b4f6008ac2a',
    title: 'npm and package.json',
    content: {
      explanation: `Real-world backend applications rarely build everything from zero. When you need a web server framework, password hashing, input validation, or a database driver, you use open-source packages written and tested by the community.

npm (Node Package Manager) is two things working together:
1. An online public registry (https://www.npmjs.com) hosting millions of reusable JavaScript packages.
2. A command-line tool bundled with Node.js that downloads, installs, updates, and removes those packages in your project.

To keep track of your project's name, scripts, and installed packages, every Node.js project has a manifest file at its root called package.json, paired with an automatically generated lock file called package-lock.json.

Understanding the exact difference between package.json, package-lock.json, and the node_modules folder is essential for managing any professional Node.js project.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain the role of npm and why dependencies are declared rather than manually copied into a project.
2. Clearly distinguish between ` + '`package.json`' + ` and ` + '`package-lock.json`' + `.
3. Differentiate between production ` + '`dependencies`' + ` and development-only ` + '`devDependencies`' + `.
4. Understand beginner-level semantic versioning (` + '`MAJOR.MINOR.PATCH`' + `) and version range prefixes (` + '`^`' + ` and ` + '`~`' + `).
5. Use ` + '`npm init -y`' + `, ` + '`npm install`' + `, ` + '`npm uninstall`' + `, and ` + '`npm run`' + ` confidently.`,
        },
        {
          order: 1,
          heading: 'package.json vs. package-lock.json vs. node_modules',
          body: `Every standard Node.js project contains two files and one directory related to packages. You must understand how they differ:

1. package.json (The Project Manifest):
• What it is: A concise human-editable JSON file at the root of your project.
• What it stores: Project metadata (name, version, description, module type), custom command shortcuts ("scripts"), and the list of top-level packages your project requires ("dependencies" and "devDependencies") along with allowed version ranges.
• Git Rule: ALWAYS commit package.json to Git.

2. package-lock.json (The Exact Dependency Tree Lockfile):
• What it is: A machine-generated file automatically created and updated by npm whenever you install or remove packages.
• What it stores: The exact resolved version number, download URL, and cryptographic integrity hash of every single package and sub-dependency in your entire dependency tree.
• Why it matters: If package.json says "express": "^4.21.0", two teammates running 'npm install' weeks apart might otherwise get slightly different sub-versions. package-lock.json guarantees that every developer and production server installs the exact same byte-for-byte dependency tree.
• Git Rule: ALWAYS commit package-lock.json to Git for applications, and do not edit it by hand.

3. node_modules/ (The Downloaded Package Files):
• What it is: The folder where npm downloads and extracts the actual code of your dependencies.
• Why you never copy or commit it: node_modules can easily contain thousands of files and hundreds of megabytes. Instead of copying node_modules between computers or committing it to Git, you add 'node_modules/' to your '.gitignore' file. When a teammate clones the repository, they simply run 'npm install' and npm recreates 'node_modules/' cleanly using package.json and package-lock.json.`,
        },
        {
          order: 2,
          heading: 'dependencies vs. devDependencies & Semantic Versioning',
          body: `Inside package.json, packages are divided into two categories:

1. "dependencies":
Packages required for your application to run in production—such as 'express' (web framework), 'mongoose' (MongoDB ODM), 'dotenv' (environment variables), or 'helmet' (security headers).
Installed via: npm install <package-name>

2. "devDependencies":
Packages only needed during local development, testing, or building—such as 'typescript' (type checker), 'eslint' (code linter), or testing tools. They are not needed at runtime in production.
Installed via: npm install --save-dev <package-name> (or shorthand: npm install -D <package-name>)

Semantic Versioning (SemVer) Basics:
Package versions follow a three-number format: MAJOR.MINOR.PATCH (for example, 4.21.2):
• MAJOR (4): Incremented when incompatible breaking changes are made.
• MINOR (21): Incremented when new backward-compatible features are added.
• PATCH (2): Incremented when backward-compatible bug or security fixes are made.

Version Range Symbols in package.json:
• Caret (^4.21.2): Allows automatic updates to MINOR and PATCH versions (anything >=4.21.2 and <5.0.0), blocking breaking MAJOR upgrades. This is npm's default.
• Tilde (~4.21.2): Allows only PATCH updates (anything >=4.21.2 and <4.22.0).`,
        },
        {
          order: 3,
          heading: 'Essential npm Commands and npm Scripts',
          body: `Here are the core npm commands you will use daily:

• Initialize a new package.json file:
  npm init -y
  (Creates a starter package.json with default settings).

• Install all dependencies listed in an existing project's package.json:
  npm install

• Install a specific production package (adds to "dependencies"):
  npm install express

• Install a development-only package (adds to "devDependencies"):
  npm install -D typescript

• Remove an unneeded package (removes from node_modules and package.json):
  npm uninstall express

• Run custom project scripts defined in package.json:
  npm run <script-name>
  For example, if package.json defines:
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  }
  You can run 'npm run dev' (or 'npm start', as 'start' is a special built-in shortcut for 'npm run start').`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Manually Copying or Committing the 'node_modules' Folder:
Mistake: Uploading the huge 'node_modules' folder to GitHub or emailing a zip file containing 'node_modules'.
Reality: 'node_modules' is large and sometimes contains operating-system-specific binary files. Always ignore 'node_modules' in Git and run 'npm install' on the target machine.

2. Deleting 'package-lock.json' Without Reason:
Mistake: Thinking 'package-lock.json' is clutter and deleting it before committing code.
Reality: Deleting the lock file removes reproducible builds, potentially causing subtle "it works on my machine" bugs when sub-dependencies update unexpectedly.

3. Installing Unverified or Typosquatted Packages:
Mistake: Running 'npm install' on a misspelled package name without checking its legitimacy.
Reality: Attackers sometimes publish malicious packages with names similar to popular libraries (typosquatting). Always double-check the exact package name and only install packages your project genuinely needs.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task',
          body: `Practice Task:
Inspect the example package.json snippet below and answer the following questions:

{
  "name": "course-catalog-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.21.2"
  },
  "devDependencies": {
    "typescript": "~5.8.2"
  }
}

Questions:
1. Which terminal command will execute 'node --watch server.js'?
2. If you share this project with a classmate (without the node_modules folder), what single command must they run to download all required packages?
3. In the version "^4.21.2", which number is the MAJOR version, which is MINOR, and which is PATCH?`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• npm is the package manager and registry for Node.js.
• package.json declares your project's metadata, runnable scripts, and required dependency ranges.
• package-lock.json locks the exact resolved versions of the entire dependency tree for reproducible installations across machines.
• Production packages belong in 'dependencies'; development and build tools belong in 'devDependencies'.
• Never manually copy or commit the 'node_modules' directory; reconstruct it anytime using 'npm install'.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Example package.json for a Clean Node.js Backend Project',
        language: 'json',
        code: `{
  "name": "learnsphere-starter-api",
  "version": "1.0.0",
  "description": "A clean Node.js backend project demonstrating package.json structure",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "dotenv": "^17.2.3",
    "express": "^4.21.2"
  },
  "devDependencies": {
    "typescript": "~5.8.2"
  }
}`,
        explanation: `This valid JSON file represents a typical backend 'package.json'. It declares project metadata ('name', 'version', 'description'), enables ES Modules ('"type": "module"'), defines two scripts ('start' and 'dev' using Node.js's built-in '--watch' flag), and separates runtime packages ('dotenv', 'express') from development tools ('typescript').`,
      },
      {
        title: 'Common npm Workflow Commands in the Terminal',
        language: 'powershell',
        code: `# 1. Initialize a new package.json with default values
PS C:\\projects\\my-api> npm init -y

# 2. Install a production dependency (updates package.json & package-lock.json)
PS C:\\projects\\my-api> npm install express

# 3. Install a development dependency
PS C:\\projects\\my-api> npm install -D typescript

# 4. Run the "dev" script defined in package.json
PS C:\\projects\\my-api> npm run dev

# 5. Uninstall a package cleanly if no longer needed
PS C:\\projects\\my-api> npm uninstall express`,
        explanation: `These commands illustrate the standard lifecycle of managing a Node.js project with npm: initializing 'package.json', adding dependencies, running defined scripts via 'npm run', and cleanly removing unused packages with 'npm uninstall'.`,
      },
    ],
    importantPoints: [
      'package.json declares project metadata, scripts, and top-level dependency version ranges.',
      'package-lock.json records the exact resolved version and integrity hash of every package in the dependency tree.',
      'Both package.json and package-lock.json should be committed to Git, while node_modules must be excluded via .gitignore.',
      'Use npm install <pkg> for production dependencies and npm install -D <pkg> for development-only tools.',
      'Semantic Versioning (MAJOR.MINOR.PATCH) communicates whether updates contain breaking changes, new features, or bug fixes.',
    ],
    externalReferences: [
      {
        title: 'npm Official Documentation: About package.json and package-lock.json',
        url: 'https://docs.npmjs.com/cli/v10/configuring-npm/package-json',
        source: 'npm Official Docs',
      },
      {
        title: 'Node.js Official Learn Guide: An Introduction to the npm Package Manager',
        url: 'https://nodejs.org/en/learn/getting-started/an-introduction-to-the-npm-package-manager',
        source: 'Node.js Official Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 5: CommonJS and ES Modules
  // ID: 6abe9dc8f15c2b4f6008ac2b
  // =========================================================================
  {
    topicId: '6abe9dc8f15c2b4f6008ac2b',
    title: 'CommonJS and ES Modules',
    content: {
      explanation: `As a backend application grows beyond a few dozen lines of code, keeping everything inside a single giant file becomes impossible to read, test, or maintain.

To organize code cleanly, developers split applications into Modules—separate files where each file has a focused responsibility (for example, one file for math utilities, one for database connection, and one for user routes) and explicitly shares only the functions or variables that other files need.

In the Node.js ecosystem, you will encounter two module systems:
1. CommonJS (CJS): The original module system created specifically for Node.js in 2009, which uses ` + '`require()`' + ` and ` + '`module.exports`' + `.
2. ES Modules (ESM / ECMAScript Modules): The official, modern JavaScript language standard introduced in ES6 (ES2015), which uses ` + '`import`' + ` and ` + '`export`' + `.

In fact, the LearnSphere backend itself uses ES Modules—configured via ` + '`"type": "module"`' + ` in its root ` + '`package.json`' + `—while many older tutorials and legacy Node.js codebases still use CommonJS. Knowing how to read and write both is a superpower for any Node.js developer.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain why modular code organization is essential in backend engineering.
2. Export and import functions and values using CommonJS (` + '`module.exports`' + ` and ` + '`require()`' + `).
3. Export and import functions and values using ES Modules (` + '`export`' + `, ` + '`export default`' + `, and ` + '`import`' + `).
4. Configure a Node.js project to use ES Modules via ` + '`"type": "module"`' + ` in ` + '`package.json`' + `, and understand ` + '`.cjs`' + ` and ` + '`.mjs`' + ` file extensions.`,
        },
        {
          order: 1,
          heading: 'Why Modules Exist',
          body: `Splitting backend code into modules provides three major architectural benefits:

1. Encapsulation (Private Scope by Default):
Variables and helper functions declared inside a module file are private to that file unless you explicitly export them. They do not pollute the global namespace or accidentally overwrite variables with the same name in other files.

2. Reusability:
A single validation or formatting module can be imported by ten different route controllers without duplicating code.

3. Maintainability & Testing:
When a bug occurs in token verification, you know to look inside 'services/tokenService.js' rather than scrolling through a 10,000-line file, and you can test that module in isolation.`,
        },
        {
          order: 2,
          heading: 'System 1: CommonJS (require and module.exports)',
          body: `CommonJS is the classic module format in Node.js (and remains the default if your package.json does NOT specify a "type" field):

• Exporting from a CommonJS file:
  Assign an object, function, or value to 'module.exports':
  const add = (a, b) => a + b;
  const subtract = (a, b) => a - b;
  module.exports = { add, subtract };

• Importing into another CommonJS file:
  Call the synchronous 'require()' function with the relative path to the file:
  const { add, subtract } = require('./math.cjs');

Key Characteristics of CommonJS:
• Uses 'require()' and 'module.exports' (or 'exports.name = ...').
• Loads modules synchronously at runtime.
• If a project is set to ES Modules, you can still force an individual file to be treated as CommonJS by naming it with the '.cjs' extension.`,
        },
        {
          order: 3,
          heading: 'System 2: ES Modules (import and export)',
          body: `ES Modules (ESM) is the official standard across both modern browsers and modern Node.js. As confirmed in LearnSphere's own 'package.json' ("type": "module") and 'server/' directory, LearnSphere's backend is written using ES Modules.

ESM supports two styles of exports:

1. Named Exports (exporting multiple specific items by name):
• Exporting:
  export const calculateTax = (amount) => amount * 0.15;
  export const CURRENCY = 'USD';
• Importing (must use matching names inside curly braces):
  import { calculateTax, CURRENCY } from './billing.js';

2. Default Export (exporting a single primary item from a file, max one per file):
• Exporting:
  export default function formatPrice(amount) { return \`$\${amount.toFixed(2)}\`; }
• Importing (no curly braces; you can choose any local variable name):
  import formatPrice from './formatPrice.js';

Important Rule in Node.js ESM:
When importing your own local files in Node.js ES Modules, you MUST include the full file extension (such as './billing.js') in the import path!`,
        },
        {
          order: 4,
          heading: 'How Node.js Decides Which Module System to Use',
          body: `Node.js determines whether a file is CommonJS or ES Modules using clear rules:

1. The "type" Field in package.json:
• If package.json contains "type": "module", all '.js' files in that project are treated as ES Modules (using import/export).
• If package.json has no "type" field (or has "type": "commonjs"), all '.js' files are treated as CommonJS (using require/module.exports).

2. Explicit File Extensions (.mjs and .cjs):
• Any file ending in '.mjs' is ALWAYS treated as an ES Module, regardless of package.json.
• Any file ending in '.cjs' is ALWAYS treated as CommonJS, regardless of package.json.

Basic Interoperability Tip:
• An ES Module can import a CommonJS module using a default import (e.g., import cjsPkg from './legacy.cjs').
• However, you should never mix 'require()' and 'import' syntax inside the same file.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Using 'import' Without Setting "type": "module" in package.json:
Mistake: Writing 'import express from "express"' in a brand-new project where package.json does not have '"type": "module"', triggering "SyntaxError: Cannot use import statement outside a module".
Reality: Add '"type": "module"' to your package.json (or use the '.mjs' extension) to enable ES Modules in Node.js.

2. Omitting the '.js' Extension in Relative ESM Imports:
Mistake: Writing import { helper } from './utils' instead of import { helper } from './utils.js' in Node.js ESM.
Reality: While frontend bundlers like Vite allow omitting '.js', native Node.js ES Modules strictly require the explicit file extension for relative file imports (resulting in ERR_MODULE_NOT_FOUND if omitted).

3. Confusing Named Imports and Default Imports:
Mistake: Using curly braces for a default export, or omitting curly braces for a named export.
Reality: Named exports ('export const x') require curly braces ('import { x }'); a default export ('export default fn') is imported without curly braces ('import fn').`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Module Conversion Exercise:
Look at the following CommonJS module file ('greetings.cjs'):

function sayHello(name) {
  return 'Hello, ' + name + '!';
}
const DEFAULT_ROLE = 'student';
module.exports = { sayHello, DEFAULT_ROLE };

Task:
1. Rewrite those lines using modern ES Module named exports ('export function ...' and 'export const ...').
2. Write the corresponding ES Module 'import' statement that another file ('main.js') would use to import both 'sayHello' and 'DEFAULT_ROLE' from './greetings.js'.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• Modules allow developers to split code into encapsulated, reusable files with explicit exports and imports.
• CommonJS uses 'module.exports' and 'require()', while ES Modules (ESM) uses 'export', 'export default', and 'import'.
• Setting '"type": "module"' in package.json enables ES Modules for all '.js' files in a Node.js project (which is the architecture used by the LearnSphere backend).
• Use '.cjs' to force CommonJS or '.mjs' to force ES Modules for individual files, and always include the '.js' extension on relative local imports in Node.js ESM.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Example 1: CommonJS Export and Import (.cjs)',
        language: 'javascript',
        code: `// --- File 1: mathUtils.cjs (CommonJS Module) ---
function multiply(a, b) {
  return a * b;
}

const TAX_RATE = 0.08;

module.exports = {
  multiply,
  TAX_RATE
};

// --- File 2: app.cjs (CommonJS Consumer) ---
const { multiply, TAX_RATE } = require('./mathUtils.cjs');

const subtotal = multiply(25, 4);
console.log('Subtotal:', subtotal);
console.log('Tax Amount:', subtotal * TAX_RATE);`,
        explanation: `This example demonstrates CommonJS using the '.cjs' extension (which runs as CommonJS in any Node.js project). 'mathUtils.cjs' attaches 'multiply' and 'TAX_RATE' to 'module.exports', and 'app.cjs' imports them synchronously using 'require()'.

Expected Output when running 'node app.cjs':
Subtotal: 100
Tax Amount: 8`,
      },
      {
        title: 'Example 2: ES Modules Named and Default Exports (Used in LearnSphere)',
        language: 'javascript',
        code: `// --- File 1: courseFormatter.js (ES Module with "type": "module" in package.json) ---

// Named export
export const PLATFORM_NAME = 'LearnSphere';

// Default export
export default function formatCourseLabel(title, category) {
  return \`[\${PLATFORM_NAME} - \${category}] \${title}\`;
}

// --- File 2: main.js (ES Module Consumer) ---
import formatCourseLabel, { PLATFORM_NAME } from './courseFormatter.js';

console.log('Platform:', PLATFORM_NAME);
console.log(formatCourseLabel('Node.js Fundamentals', 'Backend Development'));`,
        explanation: `This example demonstrates modern ES Modules as used throughout the LearnSphere backend. Notice how 'courseFormatter.js' provides both a named export ('PLATFORM_NAME') and a default export ('formatCourseLabel'). In 'main.js', both are imported in one statement—including the mandatory '.js' extension on './courseFormatter.js'.

Expected Output when running 'node main.js':
Platform: LearnSphere
[LearnSphere - Backend Development] Node.js Fundamentals`,
      },
    ],
    importantPoints: [
      'Modules keep variables private to each file by default and expose only what is explicitly exported.',
      'CommonJS uses module.exports and require(); ES Modules uses export, export default, and import.',
      'Adding "type": "module" in package.json makes ES Modules the default for all .js files in a Node.js project (as used in the LearnSphere backend).',
      'In Node.js ES Modules, relative imports to local files must include the file extension (for example, import x from "./helper.js").',
      'Files ending in .cjs are always treated as CommonJS, and files ending in .mjs are always treated as ES Modules.',
    ],
    externalReferences: [
      {
        title: 'Node.js Official Documentation: ECMAScript Modules (ESM)',
        url: 'https://nodejs.org/docs/latest/api/esm.html',
        source: 'Node.js Official Docs',
      },
      {
        title: 'Node.js Official Documentation: CommonJS Modules',
        url: 'https://nodejs.org/docs/latest/api/modules.html',
        source: 'Node.js Official Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 6: Asynchronous JavaScript
  // ID: 6abe9dc8f15c2b4f6008ac2c
  // =========================================================================
  {
    topicId: '6abe9dc8f15c2b4f6008ac2c',
    title: 'Asynchronous JavaScript',
    content: {
      explanation: `When you first learn programming, most code you write is synchronous: Line 1 runs to completion, then Line 2 runs, then Line 3 runs. Each line waits for the previous line to finish before starting.

Synchronous execution works great for quick in-memory tasks like adding numbers or formatting strings, which take less than a microsecond. However, backend servers constantly perform Input/Output (I/O) operations—reading files from disk, querying a MongoDB database over a network, or calling an external payment API—which can take anywhere from 10 milliseconds to several seconds.

If a backend server ran I/O operations synchronously (blocking execution), the entire server would freeze every time a single user requested data from the database.

Asynchronous JavaScript allows your program to start a slow I/O task now, continue executing other synchronous code immediately without waiting (non-blocking), and automatically run a handler function later when the slow task finishes.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Contrast synchronous (blocking) execution with asynchronous (non-blocking) execution.
2. Explain why backend applications rely on asynchronous I/O for database, file, and network operations.
3. Describe how the Call Stack, callbacks, and the Event Loop coordinate asynchronous execution at an introductory level.
4. Explain why asynchronous JavaScript does NOT mean "all lines of JavaScript run simultaneously."
5. Trace and run a practical timing example using callbacks.`,
        },
        {
          order: 1,
          heading: 'Synchronous (Blocking) vs. Asynchronous (Non-Blocking)',
          body: `Let us compare the two execution models directly:

1. Synchronous / Blocking Execution:
• Statements execute strictly one after another.
• If Statement B takes 2 seconds to read a large file synchronously, Statement C cannot start until those 2 full seconds have elapsed.
• The Call Stack is blocked (frozen) during the wait.

2. Asynchronous / Non-Blocking Execution:
• Your code initiates a time-consuming task (like reading a file or setting a timer) and provides a callback function—a function to be called back later when the task completes.
• Node.js hands the waiting work off to the system background and immediately moves to the very next line of code.
• When the background task finishes, the callback function is queued and executed by the Event Loop once the Call Stack is free.`,
        },
        {
          order: 2,
          heading: 'Why Backend Servers Must Perform Asynchronous I/O',
          body: `To appreciate why asynchronous I/O matters on a backend server, compare CPU speed to I/O speed:

• Adding two numbers in CPU memory: ~0.000001 milliseconds.
• Reading a file from a solid-state drive: ~1 to 5 milliseconds.
• Querying a cloud database over the network: ~15 to 100 milliseconds.
• Calling an external HTTP service: ~100 to 1,000 milliseconds.

In computer time, waiting 100 milliseconds for a network response is like a human waiting several hours!
If 100 students request their course dashboard at the same time:
• In a synchronous blocking server, the 100th student would have to wait for all 99 previous database queries to finish one-by-one (100 × 100ms = 10 full seconds of waiting).
• In an asynchronous non-blocking Node.js server, all 100 database queries are initiated almost immediately within a few milliseconds, and each student receives their response as soon as their query completes (~100ms).`,
        },
        {
          order: 3,
          heading: 'Introductory View: Call Stack, Callbacks, and the Event Loop',
          body: `How does JavaScript remember to run your callback function later?

1. Call Stack:
Tracks the currently executing function. Synchronous functions are pushed onto the stack when called and popped off when they return.

2. Callback Function:
A regular JavaScript function that you pass as an argument into an asynchronous function (such as setTimeout or fs.readFile) with the instruction: "Run this function once the background operation is done."

3. Event Loop:
Once all synchronous code in your script has finished and the Call Stack is empty, the Event Loop checks if any background tasks have completed. If so, it pushes their callback functions onto the Call Stack one at a time to execute.

Important Clarification — Asynchronous Does NOT Mean "Everything Runs Simultaneously":
Beginners sometimes think asynchronous code means every line of JavaScript runs in parallel at the exact same instant. That is false:
• Only one piece of your JavaScript code ever runs on the Call Stack at a single moment.
• Asynchronous simply means the waiting period happens in the background outside the Call Stack, so other JavaScript code can run in the meantime.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Trying to Return a Value Directly from Inside a Callback:
Mistake:
function getData() {
  let result;
  setTimeout(() => { result = 'Course Data'; }, 100);
  return result; // Returns undefined!
}
Reality: Because 'setTimeout' is non-blocking, 'return result' executes immediately on the Call Stack—100 milliseconds BEFORE the callback ever runs! You must handle the data inside the callback (or use Promises / async-await, covered in the next topic).

2. Deeply Nesting Callbacks ("Callback Hell"):
Mistake: Nesting five asynchronous callbacks inside one another when Step 2 depends on Step 1, creating a pyramid of hard-to-read code.
Reality: Modern Node.js uses Promises and async/await to write sequential asynchronous steps cleanly without deep callback nesting.

3. Forgetting Error-First Callback Conventions:
Mistake: Ignoring the first 'err' parameter in classic Node.js callbacks like fs.readFile(path, (err, data) => ...).
Reality: In callback-based Node.js APIs, the first parameter is always reserved for an Error object (which is null if the operation succeeded). Always check 'if (err)' first.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task',
          body: `Hands-On Timing Exercise:
Create a file named 'async_timing.js' and write code that:
1. Synchronously prints "1. Server received request".
2. Uses setTimeout(..., 200) to simulate a slow 200ms database query that prints "4. Slow database query finished (200ms)".
3. Uses setTimeout(..., 50) to simulate a fast 50ms cache check that prints "3. Fast cache check finished (50ms)".
4. Synchronously prints "2. Server is still responsive to other tasks".

Run 'node async_timing.js' in your terminal and verify that the messages print in the exact order: 1, 2, 3, 4—even though statement 4 was written in the code before statement 3!`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• Synchronous code executes line-by-line and blocks further execution until the current operation completes.
• Asynchronous code initiates a background operation (like a timer, file read, or database query) and allows the program to continue executing subsequent lines immediately.
• A callback is a function passed into an asynchronous operation to be executed later via the Event Loop once the background work finishes.
• Asynchronous execution does not mean multiple JavaScript lines run on the Call Stack simultaneously; it means waiting happens in the background without freezing the main thread.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Runnable Timing Example: Synchronous vs. Asynchronous Callbacks',
        language: 'javascript',
        code: `// async_demo.js - Run with: node async_demo.js

console.log('Step 1: [Sync] Student requests course catalog.');

// Simulate a 300ms database query using setTimeout
setTimeout(() => {
  console.log('Step 4: [Async 300ms] Database returned 8 modules.');
}, 300);

// Simulate a faster 100ms authentication token check
setTimeout(() => {
  console.log('Step 3: [Async 100ms] Auth check completed.');
}, 100);

console.log('Step 2: [Sync] Main thread remains free to handle other work.');`,
        explanation: `This runnable script demonstrates how non-blocking timers execute in Node.js. First, 'Step 1' runs on the Call Stack. Next, the 300ms timer and 100ms timer are registered in the background without pausing the script. 'Step 2' prints immediately. After 100ms, the faster timer callback runs ('Step 3'), and after 300ms, the slower timer callback runs ('Step 4').

Expected Terminal Output:
Step 1: [Sync] Student requests course catalog.
Step 2: [Sync] Main thread remains free to handle other work.
Step 3: [Async 100ms] Auth check completed.
Step 4: [Async 300ms] Database returned 8 modules.`,
      },
    ],
    importantPoints: [
      'Synchronous operations block the Call Stack until they finish; asynchronous operations run in the background without blocking.',
      'Backend applications perform asynchronous I/O so slow network, disk, and database waits do not freeze the server for other users.',
      'A callback is a function passed to an asynchronous API that the Event Loop executes after the background operation completes.',
      'Asynchronous code does not mean multiple JavaScript statements execute on the Call Stack simultaneously.',
      'Values produced inside an asynchronous callback are not available synchronously on the line immediately following the async call.',
    ],
    externalReferences: [
      {
        title: 'MDN Web Docs: Introducing Asynchronous JavaScript',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Introducing',
        source: 'MDN Web Docs',
      },
      {
        title: 'Node.js Official Learn Guide: Asynchronous Flow Control',
        url: 'https://nodejs.org/en/learn/asynchronous-work/asynchronous-flow-control',
        source: 'Node.js Official Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 7: Promises and async/await
  // ID: 6abe9dc8f15c2b4f6008ac2d
  // =========================================================================
  {
    topicId: '6abe9dc8f15c2b4f6008ac2d',
    title: 'Promises and async/await',
    content: {
      explanation: `In early Node.js development, asynchronous operations were handled by passing callback functions. However, when a backend route needed to perform several asynchronous steps in sequence—such as finding a user, verifying their enrollment, loading a topic, and saving progress—nesting callbacks inside callbacks quickly led to deeply indented, error-prone code.

To solve this, modern JavaScript introduced Promises and the async/await syntax.

A Promise is a JavaScript object that represents the eventual completion (or failure) of an asynchronous operation and its resulting value. Instead of passing a callback into a function, the asynchronous function immediately returns a Promise object that you can attach handlers to or 'await'.

Built directly on top of Promises, 'async' and 'await' allow you to write asynchronous, non-blocking code that reads cleanly from top to bottom just like synchronous code—and lets you handle errors with standard 'try/catch' blocks.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Define a Promise and describe its three lifecycle states (` + '`pending`' + `, ` + '`fulfilled`' + `, and ` + '`rejected`' + `).
2. Chain Promise operations using ` + '`.then()`' + `, ` + '`.catch()`' + `, and ` + '`.finally()`' + `.
3. Write clean asynchronous functions using ` + '`async`' + `, ` + '`await`' + `, and ` + '`try/catch`' + ` error handling.
4. Explain why ` + '`await`' + ` pauses the ` + '`async`' + ` function without blocking the Node.js Event Loop.
5. Distinguish between sequential execution and parallel execution using ` + '`Promise.all()`' + `.`,
        },
        {
          order: 1,
          heading: 'What a Promise Is and Its Three States',
          body: `Think of a Promise like a digital receipt buzzer you receive when ordering food: at first, your order is in progress; eventually, either your meal is ready, or the kitchen informs you an ingredient is out of stock.

Every JavaScript Promise is always in one of three mutually exclusive states:

1. pending (Initial State):
The asynchronous operation (e.g., a database query) is still working in the background; it has neither succeeded nor failed yet.

2. fulfilled (Resolved State):
The asynchronous operation completed successfully, and the Promise now holds the resulting value (e.g., the user record returned from MongoDB).

3. rejected (Failed State):
The asynchronous operation failed, and the Promise holds an Error object (reason) explaining what went wrong (e.g., network timeout or invalid query).

Once a Promise transitions from 'pending' to either 'fulfilled' or 'rejected', it is considered "settled" and its state can never change again.`,
        },
        {
          order: 2,
          heading: 'Consuming Promises with .then(), .catch(), and .finally()',
          body: `Every Promise object provides three methods for handling its outcome:

• .then(onFulfilled):
Runs when the Promise is fulfilled, receiving the resolved data as its argument. '.then()' itself returns a new Promise, allowing you to chain multiple steps sequentially.

• .catch(onRejected):
Runs if the Promise (or any preceding '.then()' step in the chain) is rejected or throws an error.

• .finally(onFinally):
Runs when the Promise settles—regardless of whether it succeeded or failed. Ideal for cleanup tasks like stopping a loading indicator or closing a temporary connection.`,
        },
        {
          order: 3,
          heading: 'Writing Clean Asynchronous Code with async / await and try / catch',
          body: `While '.then()' chains are a huge improvement over nested callbacks, 'async' and 'await' make working with Promises even cleaner:

1. The 'async' Keyword:
Placed before a function declaration (e.g., async function loadCourse() { ... }).
An 'async' function ALWAYS returns a Promise. If you return a plain value inside an async function, JavaScript automatically wraps it in a fulfilled Promise.

2. The 'await' Keyword:
Used inside an 'async' function before an expression that returns a Promise (e.g., const user = await User.findById(id);).
'await' pauses the execution of that specific 'async' function until the Promise settles, and then unwraps and returns the fulfilled value.

Crucial Architectural Insight — Why 'await' Does Not Block the Server:
'await' makes your asynchronous code look synchronous and easy to read, but it does NOT make the underlying operation synchronous! While an 'async' function is paused at an 'await' statement waiting for MongoDB, Node.js suspends only that function and returns control to the Event Loop so the server can continue handling other incoming requests.

3. Error Handling and Propagation with try / catch:
If an awaited Promise rejects, JavaScript throws that rejection as an exception at the 'await' line.
• You catch and handle the error cleanly by wrapping your 'await' statements inside a 'try { ... } catch (error) { ... }' block.
• If you do not catch the error inside the function, the 'async' function's returned Promise automatically rejects, propagating the error up to whatever caller awaited your function.`,
        },
        {
          order: 4,
          heading: 'Sequential vs. Parallel Execution (Promise.all)',
          body: `In backend controllers, you often need to perform two or more asynchronous queries. You must decide whether they depend on each other:

1. Sequential Execution (When Step B Depends on Step A):
If you need to look up a user first, and then use 'user.organizationId' to fetch their organization, you MUST await them one after another:
const user = await fetchUser(userId);
const org = await fetchOrganization(user.organizationId);

2. Parallel Execution with Promise.all() (When Operations Are Independent):
Suppose you want to load a course's metadata (takes 100ms) AND count total platform users (takes 100ms). Neither query depends on the other!
• Slow Sequential Way (200ms total):
  const course = await fetchCourse(courseId);
  const userCount = await fetchUserCount();
• Fast Concurrent Way with Promise.all() (~100ms total):
  const [course, userCount] = await Promise.all([
    fetchCourse(courseId),
    fetchUserCount()
  ]);

Promise.all() takes an array of Promises, runs them concurrently, and resolves to an array of their results once all of them succeed (or rejects immediately if any one of them fails).`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Forgetting the 'await' Keyword:
Mistake: Writing const course = fetchCourseById('101'); without 'await' and then trying to read 'course.title' (which is undefined!).
Reality: Without 'await', 'course' holds the unresolved 'Promise { <pending> }' object itself, not the course data.

2. Missing Error Handling (Unhandled Promise Rejections):
Mistake: Calling an async function or awaiting a Promise without a 'try/catch' block or a '.catch()' handler.
Reality: In Node.js, an unhandled Promise rejection can terminate your server process or leave an HTTP request hanging forever without sending an error response to the client.

3. Unnecessarily Awaiting Independent Operations Sequentially:
Mistake: Awaiting three completely independent database queries one-by-one, tripling the endpoint's response time.
Reality: Use 'await Promise.all([query1, query2, query3])' whenever asynchronous operations do not depend on each other's output.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Hands-On Refactoring Exercise:
1. Write a helper function 'simulateCheck(taskName, delayMs)' that returns a new Promise which resolves after 'delayMs' milliseconds with the string "\`\${taskName} complete\`".
2. Write an 'async function runDashboardChecks()' wrapped in a 'try/catch' block.
3. Inside 'runDashboardChecks()', use 'await Promise.all([...])' to run two checks concurrently:
   • simulateCheck('Verify Auth Token', 100)
   • simulateCheck('Load Enrolled Courses', 150)
4. Print the resolved array of results to the terminal and verify that both complete in ~150ms total rather than 250ms.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• A Promise represents the eventual result of an asynchronous operation and exists in one of three states: pending, fulfilled, or rejected.
• Promises can be consumed using .then(), .catch(), and .finally(), or with the cleaner async/await syntax.
• 'await' pauses the execution of the enclosing 'async' function until the Promise settles, without blocking the Node.js Event Loop.
• Always handle rejected Promises using try/catch blocks (with async/await) or .catch() (with Promise chains).
• Use Promise.all() to run independent asynchronous operations concurrently rather than waiting for them one by one.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Using Promises with .then() / .catch() vs. async / await',
        language: 'javascript',
        code: `// promises_demo.js - Run with: node promises_demo.js

// Helper that returns a Promise simulating a database lookup
function fetchTopicById(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id <= 0) {
        reject(new Error('Invalid topic ID: must be a positive number'));
      } else {
        resolve({ id, title: 'Promises and async/await', module: 2 });
      }
    }, 80);
  });
}

// Approach 1: Consuming with .then() / .catch() / .finally()
fetchTopicById(7)
  .then((topic) => {
    console.log('[.then] Loaded topic:', topic.title);
  })
  .catch((err) => {
    console.error('[.catch] Error:', err.message);
  })
  .finally(() => {
    console.log('[.finally] Promise chain settled.');
  });

// Approach 2: Consuming with async/await and try/catch
async function runAsyncDemo() {
  try {
    const topic = await fetchTopicById(7);
    console.log('[async/await] Loaded topic:', topic.title);

    // Triggering a rejection to demonstrate catch block
    await fetchTopicById(-1);
  } catch (err) {
    console.log('[try/catch] Safely caught error:', err.message);
  }
}

runAsyncDemo();`,
        explanation: `This runnable example defines 'fetchTopicById(id)', which returns a Promise that resolves after 80ms for valid IDs or rejects with an Error for non-positive IDs. It demonstrates both the '.then().catch().finally()' chain and an 'async' function using 'await' and 'try/catch' to handle both fulfillment and rejection safely.

Expected Terminal Output:
[.then] Loaded topic: Promises and async/await
[.finally] Promise chain settled.
[async/await] Loaded topic: Promises and async/await
[try/catch] Safely caught error: Invalid topic ID: must be a positive number`,
      },
      {
        title: 'Running Independent Queries Concurrently with Promise.all()',
        language: 'javascript',
        code: `// promise_all_demo.js - Comparing sequential vs concurrent async operations
const delayFetch = (label, ms) =>
  new Promise((resolve) => setTimeout(() => resolve(\`\${label} (took \${ms}ms)\`), ms));

async function loadCoursePageData() {
  const start = Date.now();

  // Run both independent operations concurrently
  const [courseInfo, moduleCount] = await Promise.all([
    delayFetch('Course Metadata', 120),
    delayFetch('Module Count: 8', 120)
  ]);

  const elapsed = Date.now() - start;
  console.log('Results:', courseInfo, '|', moduleCount);
  console.log(\`Completed concurrently in ~\${elapsed}ms (instead of ~240ms sequentially)\`);
}

loadCoursePageData();`,
        explanation: `Because fetching 'Course Metadata' and 'Module Count' do not depend on one another, wrapping them in 'Promise.all()' starts both 120ms operations at the same time. Both finish together in roughly 120ms total instead of 240ms.

Expected Terminal Output:
Results: Course Metadata (took 120ms) | Module Count: 8 (took 120ms)
Completed concurrently in ~122ms (instead of ~240ms sequentially)`,
      },
    ],
    importantPoints: [
      'A Promise has three states: pending (working), fulfilled (succeeded with a value), and rejected (failed with an error).',
      'An async function always returns a Promise; the await keyword pauses that function until the awaited Promise settles.',
      'await improves code readability without blocking the Node.js Event Loop—other requests continue to be processed while awaiting I/O.',
      'Always wrap await calls in try/catch blocks so rejected Promises are handled gracefully.',
      'Use Promise.all() to execute independent asynchronous operations concurrently for better performance.',
    ],
    externalReferences: [
      {
        title: 'MDN Web Docs: Using Promises',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises',
        source: 'MDN Web Docs',
      },
      {
        title: 'MDN Web Docs: async function and await',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function',
        source: 'MDN Web Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 8: Environment Variables
  // ID: 6abe9dc9f15c2b4f6008ac2e
  // =========================================================================
  {
    topicId: '6abe9dc9f15c2b4f6008ac2e',
    title: 'Environment Variables',
    content: {
      explanation: `Every backend application requires configuration values that change depending on where the application is running (local development laptop, staging server, or production cloud) or that must be kept strictly confidential (database connection URLs, cryptographic signing secrets, and third-party API keys).

One of the most important security rules in software engineering is:
Never hardcode secrets, passwords, database URIs, or environment-specific settings directly inside your source code files.

Instead, backend applications store these values outside the code using Environment Variables—key-value pairs provided by the operating system environment to the running Node.js process and accessed in JavaScript via the built-in ` + '`process.env`' + ` object.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain what environment variables are and why configuration must be separated from application source code.
2. Read environment variables in Node.js using ` + '`process.env`' + ` and provide safe fallback defaults for non-sensitive settings like ` + '`PORT`' + `.
3. Understand how a local ` + '`.env`' + ` file and the ` + '`dotenv`' + ` package work during development.
4. Apply strict security practices: protecting ` + '`.env`' + ` with ` + '`.gitignore`' + `, providing a safe ` + '`.env.example`' + ` template, and never logging secret values.`,
        },
        {
          order: 1,
          heading: 'Configuration vs. Source Code (Development vs. Production)',
          body: `Your application's source code (your '.js' and '.ts' files) should remain identical whether it runs on your Windows laptop or on a production cloud server. What changes between environments is the configuration:

• In Local Development:
  - Server Port: PORT=5000
  - Database: A local or development database instance
  - Node Environment: NODE_ENV=development

• In Production:
  - Server Port: Assigned dynamically by the cloud host (e.g., PORT=8080)
  - Database: A high-availability production database cluster
  - Node Environment: NODE_ENV=production

By reading these settings from environment variables rather than hardcoding them in 'server.js', you can deploy the exact same tested code everywhere without modifying a single line of source code.`,
        },
        {
          order: 2,
          heading: 'Accessing Environment Variables with process.env and .env Files',
          body: `In Node.js, the global 'process.env' object contains all environment variables available to the current process:

• Important Rule: Every value read from 'process.env' is ALWAYS a String (or 'undefined' if the variable is not set).
  For example, if you set:
  PORT=5000
  then process.env.PORT is the string "5000". If you need a number, convert it with Number(process.env.PORT).

How .env Files and 'dotenv' Work in Local Development:
Setting variables manually in your terminal before every run can be tedious. In local development, developers store key-value pairs in a plain-text file named '.env' at the root of the project:

PORT=5000
DATABASE_URL=<your-database-url>
JWT_SECRET=<strong-secret>

As used in the LearnSphere backend ('package.json' includes the 'dotenv' package), placing:
  import 'dotenv/config';
at the very top of your entry file ('server.js') automatically reads the local '.env' file at startup and populates 'process.env'.`,
        },
        {
          order: 3,
          heading: 'Critical Security Rules for Environment Variables',
          body: `Security around environment variables is non-negotiable in professional backend engineering:

1. Never Commit '.env' to Git (.gitignore Protection):
If you push a '.env' file containing database credentials or JWT secrets to a Git repository, anyone with access to the repository (or automated bots scanning public GitHub commits within seconds) can compromise your database and forge user tokens.
• Always list '.env' inside your project's '.gitignore' file BEFORE creating '.env'.

2. Use a Safe '.env.example' Template for Teammates:
So other developers know which environment variables are required without exposing real secrets, commit a '.env.example' file containing only variable names and safe placeholder descriptions:
  PORT=5000
  DATABASE_URL=<your-database-url>
  JWT_SECRET=<strong-secret>

3. Never Print Secret Values in Console Logs or Error Responses:
Never run console.log(process.env) or console.log(process.env.JWT_SECRET). Server logs are often stored in external monitoring systems where raw secrets must never appear. Only log whether a required secret is present (e.g., Boolean(process.env.JWT_SECRET)).

4. Fail Closed on Missing Critical Secrets:
For non-sensitive settings like 'PORT', a fallback default (process.env.PORT || 5000) is helpful. However, for security secrets like 'JWT_SECRET' or 'DATABASE_URL', NEVER fall back to a weak hardcoded string like 'secret123' in production—validate that the variable is set at startup and refuse to start if it is missing.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Hardcoding Fallback Secrets in Source Code:
Mistake: Writing const secret = process.env.JWT_SECRET || 'my-fallback-secret'; in production authentication code.
Reality: If the environment variable is accidentally omitted on the server, the app silently runs with a publicly visible hardcoded secret from your repository! Validate required secrets explicitly instead.

2. Forgetting That process.env Values Are Strings:
Mistake: Setting ENABLE_CACHE=false in '.env' and checking 'if (process.env.ENABLE_CACHE)' in JavaScript.
Reality: In JavaScript, the non-empty string "false" is truthy! Always compare strings explicitly: process.env.ENABLE_CACHE === 'true'.

3. Importing 'dotenv/config' Too Late:
Mistake: Importing modules that read 'process.env' before importing 'dotenv/config'.
Reality: Place "import 'dotenv/config';" as the very first import at the top of your server entry point.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task',
          body: `Security & Configuration Exercise:
1. Write a sample '.env.example' file containing placeholders for:
   • PORT
   • NODE_ENV
   • DATABASE_URL
   • JWT_SECRET
2. Write a small Node.js validation function 'validateEnv()' that checks whether 'process.env.DATABASE_URL' and 'process.env.JWT_SECRET' are defined.
3. Ensure your validation function logs only the names of any missing variables—never logging the actual values of defined secrets.`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• Environment variables store environment-specific configuration and sensitive credentials outside application source code.
• Node.js exposes environment variables as strings on the global 'process.env' object.
• During local development, a '.env' file loaded via 'dotenv' ("import 'dotenv/config'") populates 'process.env' automatically.
• Never hardcode secrets in code, never commit '.env' files to Git (protect them via '.gitignore'), and never print secret values to console logs.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Example .env.example Template with Safe Placeholders',
        language: 'ini',
        code: `# .env.example - Safe template committed to Git (contains NO real secrets)
PORT=5000
NODE_ENV=development
DATABASE_URL=<your-database-url>
JWT_SECRET=<strong-secret>`,
        explanation: `A '.env.example' file documents the environment variables required by the backend using safe placeholder values. When setting up the project locally, a developer copies '.env.example' to '.env' (which is ignored by Git in '.gitignore') and fills in their own local configuration.`,
      },
      {
        title: 'Reading and Validating Environment Variables Safely in Node.js',
        language: 'javascript',
        code: `// config_demo.js - Safe environment variable handling in Node.js
import 'dotenv/config';

// 1. Non-sensitive configuration can safely use a sensible default and type conversion
const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 2. Verify required sensitive variables WITHOUT ever logging their secret values
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

console.log(\`[Config] Environment mode: \${NODE_ENV}\`);
console.log(\`[Config] Server port:      \${PORT} (type: \${typeof PORT})\`);

if (missingVars.length > 0) {
  console.log(\`[Config] Notice: Missing environment variables: \${missingVars.join(', ')}\`);
  console.log('[Config] Define them in your local .env file before starting production services.');
} else {
  console.log('[Config] All required environment variables are present (values hidden for security).');
}`,
        explanation: `This runnable script demonstrates best practices for reading environment variables. It converts 'process.env.PORT' from a string to a Number with a fallback of 5000, checks for the presence of 'DATABASE_URL' and 'JWT_SECRET' by inspecting keys only, and never prints any secret values to the console.

Expected Output (when run without DATABASE_URL or JWT_SECRET set):
[Config] Environment mode: development
[Config] Server port:      5000 (type: number)
[Config] Notice: Missing environment variables: DATABASE_URL, JWT_SECRET
[Config] Define them in your local .env file before starting production services.`,
      },
    ],
    importantPoints: [
      'Never hardcode credentials, API keys, database URLs, or JWT secrets in source code.',
      'Access environment variables in Node.js via process.env.<VARIABLE_NAME>.',
      'All values on process.env are strings (or undefined); convert numbers and booleans explicitly when needed.',
      'Add .env to .gitignore so real secrets are never committed to version control; commit a safe .env.example with placeholders instead.',
      'Never print secret environment variable values in console logs or HTTP responses.',
    ],
    externalReferences: [
      {
        title: 'Node.js Official Learn Guide: How to Read Environment Variables from Node.js',
        url: 'https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs',
        source: 'Node.js Official Docs',
      },
      {
        title: 'The Twelve-Factor App: III. Config (Store Config in the Environment)',
        url: 'https://12factor.net/config',
        source: 'Twelve-Factor App Methodology',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 9: Building a Simple Node.js Server
  // ID: 6abe9dc9f15c2b4f6008ac2f
  // =========================================================================
  {
    topicId: '6abe9dc9f15c2b4f6008ac2f',
    title: 'Building a Simple Node.js Server',
    content: {
      explanation: `You now have all the foundational building blocks of Node.js: the runtime, modules, asynchronous execution, environment variables, and HTTP concepts. It is time to bring them together and build a working HTTP backend server using Node.js's built-in 'node:http' module—without any external frameworks.

Before learning web frameworks like Express.js in Module 3, building a server directly with 'node:http' gives you a crystal-clear understanding of what happens under the hood: how a server listens on a host and port, how incoming Request ('req') and outgoing Response ('res') objects work, how to route requests by HTTP method and URL path, and how to send structured JSON responses with proper HTTP status codes and headers.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Import the built-in ` + '`node:http`' + ` module and create an HTTP server using ` + '`http.createServer()`' + `.
2. Inspect the incoming ` + '`req`' + ` (Request) object (` + '`req.method`' + ` and ` + '`req.url`' + `) to implement basic routing.
3. Configure the outgoing ` + '`res`' + ` (Response) object with HTTP status codes, ` + '`Content-Type: application/json`' + ` headers, and serialized JSON payloads.
4. Bind the server to a host and port using ` + '`server.listen()`' + `, and start/stop the server cleanly from the terminal.
5. Test your running server from both a web browser and a command-line HTTP client.`,
        },
        {
          order: 1,
          heading: 'Anatomy of a Node.js HTTP Server',
          body: `Let us break down every core step required to create a Node.js HTTP server:

1. Importing the Built-In HTTP Module:
  import http from 'node:http';
  The 'node:' prefix explicitly tells Node.js to load its built-in core networking module rather than looking inside 'node_modules'.

2. Creating the Server Instance with http.createServer():
  const server = http.createServer((req, res) => { ... });
  'http.createServer' takes a request listener callback function. Node.js automatically invokes this function every single time a client sends an HTTP request to your server, passing two objects:
  • req (http.IncomingMessage): Contains information about the client's incoming request—such as 'req.method' ("GET", "POST"), 'req.url' ("/", "/api/hello"), and 'req.headers'.
  • res (http.ServerResponse): Used to construct and send the server's response back to the client.

3. Setting Status Code, Response Headers, and Body:
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Hello!' }));
  • 'res.writeHead(statusCode, headers)' sets the 3-digit HTTP status code (e.g., 200 OK or 404 Not Found) and tells the client that the response body is formatted as JSON ('Content-Type: application/json').
  • 'res.end(data)' transmits the serialized string body over the network and signals to the client that the response is complete.

4. Binding to a Port and Host with server.listen():
  server.listen(PORT, HOST, () => { ... });
  Starts the server so it actively listens for incoming network connections on the specified port (e.g., 5000) and host (e.g., '127.0.0.1' or 'localhost').`,
        },
        {
          order: 2,
          heading: 'Implementing Basic Routing by Method and Path',
          body: `A real server needs to respond differently depending on which URL path and HTTP method the client requested.

In raw Node.js, you implement basic routing by checking 'req.method' and 'req.url' with conditional statements:

• Route 1: GET /
  Returns a welcome message and basic service metadata with status 200 OK.

• Route 2: GET /api/hello
  Returns a structured JSON greeting payload with status 200 OK.

• Fallback Route (404 Not Found):
  If a client requests an unknown path (such as GET /unknown) or an unsupported method, the server must still complete the request-response cycle by returning status 404 Not Found with a clear JSON error message.`,
        },
        {
          order: 3,
          heading: 'Starting, Testing, and Stopping the Server',
          body: `Unlike a simple script that prints a value and exits immediately, an HTTP server stays running continuously in the Event Loop waiting for client requests:

1. Starting the Server in the Terminal:
  node server.js
  Notice that your terminal prompt does not return immediately—that means the server is actively listening!

2. Testing from a Web Browser:
  Open your browser and visit:
  • http://localhost:5000/
  • http://localhost:5000/api/hello
  The browser sends a GET request and displays the returned JSON response.

3. Testing from a Second Terminal Window (Command-Line Client):
  Keep the server running in Terminal 1, open a second terminal window, and run:
  curl -i http://localhost:5000/api/hello
  The '-i' flag displays both the HTTP status line, the response headers ('Content-Type: application/json'), and the JSON body.

4. Stopping the Server:
  Click inside the terminal window where the server is running and press:
  Ctrl + C
  This sends a termination signal to the Node.js process, stopping the server and freeing the port.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Forgetting to Call res.end():
Mistake: Calling res.writeHead(200) or setting data, but forgetting to call res.end(...).
Reality: Without 'res.end()', the server never finishes the HTTP response. The browser tab will spin indefinitely until the connection times out! Every code path in your request handler must call 'res.end()'.

2. Passing a Raw JavaScript Object Directly to res.end():
Mistake: Calling res.end({ message: 'Hello' }) without JSON.stringify().
Reality: 'res.end()' only accepts a String or a Buffer. Passing a raw object throws a "TypeError [ERR_INVALID_ARG_TYPE]". Always serialize objects with 'JSON.stringify(data)'.

3. Port Already in Use (EADDRINUSE Error):
Mistake: Starting a second copy of 'node server.js' in another terminal while the first server is still running on port 5000, causing "Error: listen EADDRINUSE: address already in use :::5000".
Reality: Only one process can listen on a given port at a time. Stop the existing server with Ctrl + C (or use a different port) before starting it again.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task',
          body: `Hands-On Server Extension Task:
Take the runnable server example below and add a third route:
• Method: GET
• Path: /api/status
• Response Status Code: 200
• Response JSON Body:
  {
    "status": "ok",
    "runtime": "Node.js",
    "uptimeSeconds": Math.floor(process.uptime())
  }

Test your new route at http://localhost:5000/api/status and verify that 'uptimeSeconds' increases each time you refresh the page!`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• Node.js includes the built-in 'node:http' module for creating HTTP servers without external dependencies.
• http.createServer((req, res) => { ... }) processes every incoming request using the 'req' (Request) and 'res' (Response) objects.
• Basic routing inspects 'req.method' and 'req.url' to match endpoints like 'GET /' and 'GET /api/hello', with a 404 fallback for unmatched routes.
• Always set the 'Content-Type: application/json' header, serialize objects with 'JSON.stringify()', and finalize every response with 'res.end()'.
• While 'node:http' teaches core fundamentals, as routes and middleware grow complex, developers adopt Express.js—which you will master in Module 3.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Complete Runnable Node.js HTTP Server with Basic Routing (server.js)',
        language: 'javascript',
        code: `// server.js - A complete, runnable Node.js HTTP server
import http from 'node:http';

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT) || 5000;

// Helper function to send a consistent JSON response
function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

// Create the HTTP server
const server = http.createServer((req, res) => {
  const { method, url } = req;
  console.log(\`[Request] \${method} \${url}\`);

  // Route 1: GET /
  if (method === 'GET' && url === '/') {
    return sendJson(res, 200, {
      service: 'LearnSphere Node.js Starter Server',
      status: 'running',
      endpoints: ['GET /', 'GET /api/hello']
    });
  }

  // Route 2: GET /api/hello
  if (method === 'GET' && url === '/api/hello') {
    return sendJson(res, 200, {
      message: 'Hello from your Node.js HTTP server!',
      module: 'Module 2 — Node.js Fundamentals'
    });
  }

  // Fallback Route: 404 Not Found for any other path or method
  return sendJson(res, 404, {
    error: 'Not Found',
    message: \`No route defined for \${method} \${url}\`
  });
});

// Start listening on HOST and PORT
server.listen(PORT, HOST, () => {
  console.log(\`Server running at http://\${HOST}:\${PORT}\`);
  console.log('Press Ctrl + C to stop the server.');
});`,
        explanation: `Line-by-line overview:
1. 'import http from "node:http"' loads Node.js's built-in HTTP networking module.
2. 'HOST' and 'PORT' configure where the server listens (defaulting to 127.0.0.1:5000).
3. 'sendJson()' encapsulates 'res.writeHead()' (setting the HTTP status code and JSON Content-Type header) and 'res.end(JSON.stringify(payload))'.
4. Inside 'http.createServer()', the callback extracts 'req.method' and 'req.url' and routes 'GET /', 'GET /api/hello', and a 404 fallback.
5. 'server.listen()' binds the server to the port and keeps the Node.js Event Loop active.

Expected Terminal Behavior when running 'node server.js':
Server running at http://127.0.0.1:5000
Press Ctrl + C to stop the server.
[Request] GET /
[Request] GET /api/hello
[Request] GET /unknown

Expected Browser / API Response for GET http://127.0.0.1:5000/api/hello (Status 200 OK):
{"message":"Hello from your Node.js HTTP server!","module":"Module 2 — Node.js Fundamentals"}

Expected Browser / API Response for GET http://127.0.0.1:5000/unknown (Status 404 Not Found):
{"error":"Not Found","message":"No route defined for GET /unknown"}`,
      },
    ],
    importantPoints: [
      'The built-in node:http module allows Node.js to create HTTP servers without installing external packages.',
      'http.createServer((req, res) => { ... }) receives an incoming Request object (req) and an outgoing Response object (res).',
      'Inspect req.method and req.url to route requests to different handlers and return 404 Not Found for unmatched paths.',
      'Use res.writeHead(statusCode, headers) to set the HTTP status code and Content-Type: application/json header.',
      'Always serialize response objects with JSON.stringify() and call res.end() to complete the HTTP response.',
    ],
    externalReferences: [
      {
        title: 'Node.js Official Documentation: HTTP Module (node:http)',
        url: 'https://nodejs.org/docs/latest/api/http.html',
        source: 'Node.js Official Docs',
      },
      {
        title: 'Node.js Official Guide: Anatomy of an HTTP Transaction',
        url: 'https://nodejs.org/en/learn/modules/anatomy-of-an-http-transaction',
        source: 'Node.js Official Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];

async function populateModule2() {
  console.log('===================================================================');
  console.log('=== LearnSphere: Populating Module 2 Educational Content        ===');
  console.log('===================================================================\n');

  // Step 1: Log in as Course Creator
  console.log(`Authenticating as Course Creator (${CREATOR_EMAIL})...`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CREATOR_EMAIL, password: CREATOR_PASSWORD }),
  });

  if (!loginRes.ok) {
    const errorBody = await loginRes.text();
    throw new Error(`Course Creator authentication failed (${loginRes.status}): ${errorBody}`);
  }

  const loginData = await loginRes.json();
  const accessToken = loginData.data?.accessToken;
  const userRole = loginData.data?.user?.role;
  console.log(`✓ Authenticated successfully. User role: "${userRole}"`);

  if (userRole !== 'course_creator') {
    throw new Error(`Expected role 'course_creator', received '${userRole}'`);
  }

  // Step 2: Loop over each topic and update content via Course Creator API
  console.log(`\nBeginning content population for ${module2TopicsContent.length} topics in Module 2...`);

  let successCount = 0;

  for (const topicData of module2TopicsContent) {
    const { topicId, title, content, codeExamples, importantPoints, externalReferences, videos, images } = topicData;
    console.log(`\nUpdating Topic: "${title}" (ID: ${topicId})...`);

    const updateUrl = `${BASE_URL}/api/creator/courses/${COURSE_ID}/modules/${MODULE_2_ID}/topics/${topicId}/content`;
    const payload = {
      content,
      codeExamples,
      importantPoints,
      externalReferences,
      videos: videos || { english: null, telugu: null, hindi: null },
      images: images || [],
    };

    const updateRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error(`✗ Failed to update Topic "${title}" (Status ${updateRes.status}): ${errText}`);
      throw new Error(`Topic update failed for "${title}"`);
    }

    console.log(`  ✓ Successfully updated topic content via PATCH endpoint (HTTP ${updateRes.status})`);

    // Verify by reading back the content via GET /content
    const verifyRes = await fetch(updateUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!verifyRes.ok) {
      throw new Error(`Failed to verify topic content via GET (Status ${verifyRes.status})`);
    }

    const verifyData = await verifyRes.json();
    const retrieved = verifyData.data?.content;

    const hasExplanation = Boolean(retrieved?.content?.explanation?.length > 200);
    const sectionsCount = retrieved?.content?.sections?.length || 0;
    const examplesCount = retrieved?.codeExamples?.length || 0;
    const pointsCount = retrieved?.importantPoints?.length || 0;
    const refsCount = retrieved?.externalReferences?.length || 0;

    console.log(`  ✓ Verified persisted content:`);
    console.log(`    - Explanation length: ${retrieved?.content?.explanation?.length} chars`);
    console.log(`    - Sections count:     ${sectionsCount}`);
    console.log(`    - Code examples:      ${examplesCount}`);
    console.log(`    - Important points:   ${pointsCount}`);
    console.log(`    - External references:${refsCount}`);

    if (!hasExplanation || sectionsCount < 6 || pointsCount < 5 || examplesCount < 1 || refsCount < 2) {
      throw new Error(`Persisted content validation failed for "${title}"`);
    }

    successCount++;
  }

  console.log(`\n===================================================================`);
  console.log(`✓ Completed: Successfully populated and verified all ${successCount}/${module2TopicsContent.length} topics in Module 2!`);
  console.log(`===================================================================`);
}

populateModule2()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error during Module 2 content population:', err);
    process.exit(1);
  });
