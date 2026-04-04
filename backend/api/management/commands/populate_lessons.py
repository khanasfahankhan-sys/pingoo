from django.core.management.base import BaseCommand
from django.utils.text import slugify
from api.models import Course, Lesson


class Command(BaseCommand):
    help = 'Populate courses with complete lessons for Python Basics, Web Development Basics, and JavaScript Essentials'

    def handle(self, *args, **options):
        self.stdout.write('Starting to populate lessons...')
        
        # Get or create courses
        python_basics = self.get_course('Python Basics', 'python-basics')
        web_dev_basics = self.get_course('Web Development Basics', 'web-development-basics')
        js_essentials = self.get_course('JavaScript Essentials', 'javascript-essentials')
        
        # Create lessons for each course
        self.create_python_lessons(python_basics)
        self.create_web_dev_lessons(web_dev_basics)
        self.create_javascript_lessons(js_essentials)
        
        self.stdout.write(self.style.SUCCESS('Successfully populated all courses with lessons!'))

    def get_course(self, title, slug):
        course, created = Course.objects.get_or_create(
            slug=slug,
            defaults={
                'title': title,
                'description': f'Complete course for {title}',
                'level': 'beginner',
                'is_published': True
            }
        )
        if created:
            self.stdout.write(f'Created course: {title}')
        return course

    def create_lesson(self, course, title, content, summary, expected_output, solution_keywords, language, order, difficulty='easy'):
        lesson, created = Lesson.objects.get_or_create(
            course=course,
            slug=slugify(title),
            defaults={
                'title': title,
                'order': order,
                'summary': summary,
                'content': content,
                'expected_output': expected_output,
                'solution_keywords': solution_keywords,
                'language': language,
                'difficulty': difficulty,
                'estimated_minutes': 15,
                'is_published': True
            }
        )
        if created:
            self.stdout.write(f'Created lesson: {title}')
        return lesson

    def create_python_lessons(self, course):
        lessons = [
            {
                'title': 'Hello World in Python',
                'content': '''# Hello World in Python

Welcome to your first Python lesson! In this lesson, you'll learn how to write your first Python program.

## What is Python?
Python is a high-level, interpreted programming language known for its simplicity and readability. It's great for beginners!

## Your First Program
The traditional first program in any programming language is "Hello, World!". Let's write it in Python.

## Task
Write a Python program that prints "Hello, World!" to the console.

## Hint
Use the `print()` function in Python. The syntax is:
```python
print("Your text here")
```

## Try it!
Write your code in the editor below and click Run to see the output.''',
                'summary': 'Learn to write your first Python program using the print() function.',
                'expected_output': 'Hello, World!',
                'solution_keywords': ['print'],
                'language': 'python',
                'order': 1
            },
            {
                'title': 'Variables and Data Types',
                'content': '''# Variables and Data Types

In this lesson, you'll learn about variables and basic data types in Python.

## What are Variables?
Variables are containers for storing data values. In Python, you don't need to declare the type of variable - Python automatically determines it!

## Common Data Types
- **String (str)**: Text data, like "Hello"
- **Integer (int)**: Whole numbers, like 42
- **Float (float)**: Decimal numbers, like 3.14

## Task
Create a variable called `name` with your name as a string, and a variable called `age` with your age as a number. Then print both variables.

## Expected Output
Your output should show your name and age, like:
```
Alice
25
```

## Hint
```python
name = "Your Name"
age = your_age_number
print(name)
print(age)
```''',
                'summary': 'Learn about variables and basic data types in Python.',
                'expected_output': 'Alice\n25',
                'solution_keywords': ['name', 'age'],
                'language': 'python',
                'order': 2
            },
            {
                'title': 'Basic Math Operations',
                'content': '''# Basic Math Operations

Python can perform all the basic mathematical operations you'd expect!

## Math Operators
- `+` : Addition
- `-` : Subtraction  
- `*` : Multiplication
- `/` : Division
- `**` : Exponent (power)
- `%` : Modulo (remainder)

## Task
Create two variables `x` and `y` with values 10 and 3. Then print the results of:
1. Addition (x + y)
2. Multiplication (x * y)
3. Division (x / y)

## Expected Output
```
13
30
3.3333333333333335
```

## Hint
```python
x = 10
y = 3
print(x + y)
print(x * y)
print(x / y)
```''',
                'summary': 'Learn basic mathematical operations in Python.',
                'expected_output': '13\n30\n3.3333333333333335',
                'solution_keywords': ['x', 'y', '+', '*', '/'],
                'language': 'python',
                'order': 3
            },
            {
                'title': 'String Manipulation',
                'content': '''# String Manipulation

Strings are one of the most important data types in Python. Let's learn how to work with them!

## String Operations
- Concatenation: Joining strings with `+`
- Repetition: Repeating strings with `*`
- Length: Getting string length with `len()`
- Upper/Lower case: `.upper()` and `.lower()`

## Task
Create a variable `greeting` with "Hello" and a variable `name` with "World". Then:
1. Combine them with a space in between
2. Convert the result to uppercase
3. Print the final result

## Expected Output
```
HELLO WORLD
```

## Hint
```python
greeting = "Hello"
name = "World"
result = greeting + " " + name
print(result.upper())
```''',
                'summary': 'Learn how to manipulate strings in Python.',
                'expected_output': 'HELLO WORLD',
                'solution_keywords': ['greeting', 'name', 'upper'],
                'language': 'python',
                'order': 4
            },
            {
                'title': 'Lists and Indexing',
                'content': '''# Lists and Indexing

Lists are ordered collections of items in Python. They can hold multiple values of different types!

## List Basics
- Create lists with square brackets: `[1, 2, 3]`
- Access items with index (starting from 0): `my_list[0]`
- Lists can contain mixed types: `["text", 42, True]`

## Task
Create a list called `fruits` with three fruits: "apple", "banana", "orange". Then print the first and last fruits.

## Expected Output
```
apple
orange
```

## Hint
```python
fruits = ["apple", "banana", "orange"]
print(fruits[0])  # First item
print(fruits[2])  # Last item (or use fruits[-1])
```''',
                'summary': 'Learn about lists and how to access items by index.',
                'expected_output': 'apple\norange',
                'solution_keywords': ['fruits', '[', ']'],
                'language': 'python',
                'order': 5
            },
            {
                'title': 'Conditional Statements',
                'content': '''# Conditional Statements

Conditional statements allow your program to make decisions based on different conditions.

## If Statements
- `if`: Executes code if condition is true
- `elif`: Checks another condition if previous was false
- `else`: Executes code if all conditions were false

## Comparison Operators
- `==` : Equal to
- `!=` : Not equal to
- `>` : Greater than
- `<` : Less than
- `>=` : Greater than or equal to
- `<=` : Less than or equal to

## Task
Create a variable `age` with value 18. Write a program that prints "You can vote!" if age is 18 or older, otherwise prints "Too young to vote."

## Expected Output
```
You can vote!
```

## Hint
```python
age = 18
if age >= 18:
    print("You can vote!")
else:
    print("Too young to vote.")
```''',
                'summary': 'Learn how to use if statements to make decisions in your code.',
                'expected_output': 'You can vote!',
                'solution_keywords': ['if', 'else', '>='],
                'language': 'python',
                'order': 6
            },
            {
                'title': 'For Loops',
                'content': '''# For Loops

Loops allow you to repeat code multiple times. The `for` loop is perfect for iterating over sequences!

## For Loop Syntax
```python
for item in sequence:
    # Code to repeat
```

## Common Uses
- Loop through lists
- Loop through ranges of numbers
- Loop through strings

## Task
Create a list with numbers 1, 2, 3, 4, 5. Use a for loop to print each number multiplied by 2.

## Expected Output
```
2
4
6
8
10
```

## Hint
```python
numbers = [1, 2, 3, 4, 5]
for num in numbers:
    print(num * 2)
```''',
                'summary': 'Learn how to use for loops to repeat code and iterate over sequences.',
                'expected_output': '2\n4\n6\n8\n10',
                'solution_keywords': ['for', 'in', 'numbers'],
                'language': 'python',
                'order': 7
            },
            {
                'title': 'Functions',
                'content': '''# Functions

Functions are reusable blocks of code that perform specific tasks. They help you organize your code and avoid repetition!

## Defining Functions
```python
def function_name(parameters):
    # Code block
    return result
```

## Why Use Functions?
- Reusability: Write once, use many times
- Organization: Break complex problems into smaller pieces
- Testing: Easier to test small, focused functions

## Task
Define a function called `add_five` that takes one parameter and returns that parameter plus 5. Then call the function with the number 10 and print the result.

## Expected Output
```
15
```

## Hint
```python
def add_five(number):
    return number + 5

result = add_five(10)
print(result)
```''',
                'summary': 'Learn how to define and use functions to create reusable code.',
                'expected_output': '15',
                'solution_keywords': ['def', 'return', 'add_five'],
                'language': 'python',
                'order': 8
            }
        ]

        for lesson_data in lessons:
            self.create_lesson(course, **lesson_data)

    def create_web_dev_lessons(self, course):
        lessons = [
            {
                'title': 'HTML Structure and Tags',
                'content': '''# HTML Structure and Tags

Welcome to Web Development Basics! In this lesson, you'll learn the fundamental building blocks of HTML.

## What is HTML?
HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure and content of a webpage.

## Basic HTML Structure
Every HTML document has a basic structure:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Page Title</title>
</head>
<body>
    <!-- Content goes here -->
</body>
</html>
```

## Common HTML Tags
- `<h1>` to `<h6>`: Heading tags
- `<p>`: Paragraph
- `<div>`: Container for other elements
- `<span>`: Inline container
- `<a>`: Links
- `<img>`: Images

## Task
Create a simple HTML page with:
- A main heading "My First Web Page"
- A paragraph saying "Hello, World!"
- A subheading "About This Page"
- Another paragraph "This is my first HTML project."

## Hint
Start with the basic HTML structure and add your content inside the `<body>` section.

Try it in the editor below and see your live preview!''',
                'summary': 'Learn the basic structure of HTML and common tags.',
                'expected_output': 'HTML Preview Rendered',
                'solution_keywords': ['<h1>', '<p>', '<h2>'],
                'language': 'html',
                'order': 1
            },
            {
                'title': 'Text Formatting and Links',
                'content': '''# Text Formatting and Links

In this lesson, you'll learn how to format text and create links in HTML.

## Text Formatting Tags
- `<strong>` or `<b>`: Bold text
- `<em>` or `<i>`: Italic text
- `<u>`: Underlined text
- `<br>`: Line break
- `<hr>`: Horizontal rule

## Creating Links
Use the `<a>` tag to create links:
```html
<a href="https://example.com">Link Text</a>
```

## Task
Create an HTML page with:
- A heading "My Favorite Websites"
- A paragraph with some **bold** and *italic* text
- At least 3 links to popular websites (Google, YouTube, Wikipedia)
- A horizontal rule after the links

## Hint
```html
<h1>My Favorite Websites</h1>
<p>I love using <strong>Google</strong> and <em>YouTube</em> for learning!</p>
<a href="https://google.com">Google</a><br>
<a href="https://youtube.com">YouTube</a><br>
<a href="https://wikipedia.org">Wikipedia</a><br>
<hr>
```''',
                'summary': 'Learn how to format text and create hyperlinks in HTML.',
                'expected_output': 'HTML Preview Rendered',
                'solution_keywords': ['<strong>', '<em>', '<a>', 'href'],
                'language': 'html',
                'order': 2
            },
            {
                'title': 'Images and Alt Text',
                'content': '''# Images and Alt Text

Images make web pages visually appealing. In this lesson, you'll learn how to add images to your HTML pages.

## Image Tag
The `<img>` tag is used to embed images:
```html
<img src="image-url" alt="description">
```

## Important Attributes
- `src`: Source URL of the image
- `alt`: Alternative text for accessibility
- `width`: Width of the image
- `height`: Height of the image

## Using Placeholder Images
For practice, you can use placeholder image services:
- `https://picsum.photos/seed/keyword/width/height.jpg`

## Task
Create an HTML page with:
- A heading "My Image Gallery"
- At least 3 different images with descriptive alt text
- Each image should have different dimensions
- A caption below each image

## Hint
```html
<h1>My Image Gallery</h1>
<img src="https://picsum.photos/seed/cat/300/200.jpg" alt="A cute cat" width="300">
<p>This is a cute cat!</p>
```''',
                'summary': 'Learn how to add images to HTML pages with proper alt text.',
                'expected_output': 'HTML Preview Rendered',
                'solution_keywords': ['<img>', 'src', 'alt'],
                'language': 'html',
                'order': 3
            },
            {
                'title': 'Lists in HTML',
                'content': '''# Lists in HTML

Lists help organize content in a structured way. HTML provides two main types of lists.

## Unordered Lists
Use `<ul>` for bulleted lists:
```html
<ul>
    <li>First item</li>
    <li>Second item</li>
    <li>Third item</li>
</ul>
```

## Ordered Lists
Use `<ol>` for numbered lists:
```html
<ol>
    <li>Step one</li>
    <li>Step two</li>
    <li>Step three</li>
</ol>
```

## Description Lists
Use `<dl>` for term-description pairs:
```html
<dl>
    <dt>HTML</dt>
    <dd>HyperText Markup Language</dd>
    <dt>CSS</dt>
    <dd>Cascading Style Sheets</dd>
</dl>
```

## Task
Create a page with:
- A heading "My Shopping List"
- An unordered list of 5 items you want to buy
- An ordered list of steps to make a sandwich
- A description list of web technologies

## Hint
```html
<h1>My Shopping List</h1>
<h2>Items to Buy</h2>
<ul>
    <li>Milk</li>
    <li>Bread</li>
    <li>Eggs</li>
</ul>
```''',
                'summary': 'Learn how to create different types of lists in HTML.',
                'expected_output': 'HTML Preview Rendered',
                'solution_keywords': ['<ul>', '<ol>', '<li>', '<dl>', '<dt>', '<dd>'],
                'language': 'html',
                'order': 4
            },
            {
                'title': 'Tables Basics',
                'content': '''# Tables Basics

Tables are perfect for displaying tabular data in rows and columns.

## Table Structure
```html
<table>
    <thead>
        <tr>
            <th>Header 1</th>
            <th>Header 2</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
        </tr>
    </tbody>
</table>
```

## Table Tags
- `<table>`: Container for the table
- `<thead>`: Table header section
- `<tbody>`: Table body section
- `<tr>`: Table row
- `<th>`: Table header cell
- `<td>`: Table data cell

## Task
Create a table showing a weekly schedule with:
- Days of the week as headers
- Activities for each day
- At least 3 different activities

## Hint
```html
<table>
    <thead>
        <tr>
            <th>Monday</th>
            <th>Tuesday</th>
            <th>Wednesday</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>School</td>
            <td>Work</td>
            <td>Gym</td>
        </tr>
    </tbody>
</table>
```''',
                'summary': 'Learn how to create tables to display structured data.',
                'expected_output': 'HTML Preview Rendered',
                'solution_keywords': ['<table>', '<tr>', '<th>', '<td>'],
                'language': 'html',
                'order': 5
            },
            {
                'title': 'Forms and Input Fields',
                'content': '''# Forms and Input Fields

Forms allow users to input data and interact with your website.

## Form Structure
```html
<form action="/submit" method="post">
    <!-- Form elements go here -->
    <button type="submit">Submit</button>
</form>
```

## Common Input Types
- `text`: Single-line text input
- `email`: Email address input
- `password`: Password field
- `number`: Number input
- `textarea`: Multi-line text input
- `select`: Dropdown menu
- `checkbox`: Checkbox option
- `radio`: Radio button option

## Task
Create a contact form with:
- Name field (text)
- Email field (email)
- Age field (number)
- Message field (textarea)
- Submit button

## Hint
```html
<form>
    <label for="name">Name:</label><br>
    <input type="text" id="name" name="name"><br><br>
    
    <label for="email">Email:</label><br>
    <input type="email" id="email" name="email"><br><br>
    
    <button type="submit">Submit</button>
</form>
```''',
                'summary': 'Learn how to create interactive forms with various input types.',
                'expected_output': 'HTML Preview Rendered',
                'solution_keywords': ['<form>', '<input>', '<label>', '<textarea>'],
                'language': 'html',
                'order': 6
            },
            {
                'title': 'Div and Span Elements',
                'content': '''# Div and Span Elements

Div and span are fundamental container elements that help structure your HTML.

## Div Element
- `<div>` is a block-level container
- Takes up the full width available
- Creates a new line before and after
- Used for grouping larger sections

## Span Element
- `<span>` is an inline container
- Only takes up as much width as needed
- Doesn't create line breaks
- Used for styling small portions of text

## Task
Create a page that demonstrates the difference between div and span:
- Use divs to create distinct sections
- Use spans to highlight specific words within text
- Include some styled content

## Hint
```html
<div style="background-color: lightblue; padding: 10px;">
    <h2>Section 1</h2>
    <p>This is a <span style="color: red;">highlighted word</span> in a paragraph.</p>
</div>

<div style="background-color: lightgreen; padding: 10px;">
    <h2>Section 2</h2>
    <p>Another section with <span style="font-weight: bold;">bold text</span>.</p>
</div>
```''',
                'summary': 'Learn the difference between div (block) and span (inline) elements.',
                'expected_output': 'HTML Preview Rendered',
                'solution_keywords': ['<div>', '<span>', 'style'],
                'language': 'html',
                'order': 7
            },
            {
                'title': 'Semantic HTML5 Elements',
                'content': '''# Semantic HTML5 Elements

HTML5 introduced semantic elements that give meaning to your content structure.

## Common Semantic Elements
- `<header>`: Header section
- `<nav>`: Navigation section
- `<main>`: Main content area
- `<section>`: Thematic grouping of content
- `<article>`: Self-contained content
- `<aside>`: Sidebar content
- `<footer>`: Footer section

## Why Use Semantic HTML?
- Better accessibility
- Improved SEO
- Clearer code structure
- Easier maintenance

## Task
Create a complete page structure using semantic HTML5 elements:
- Header with navigation
- Main content with articles
- Sidebar with related links
- Footer with copyright information

## Hint
```html
<header>
    <h1>My Website</h1>
    <nav>
        <a href="#home">Home</a> | 
        <a href="#about">About</a> | 
        <a href="#contact">Contact</a>
    </nav>
</header>

<main>
    <section>
        <article>
            <h2>Article Title</h2>
            <p>Article content goes here...</p>
        </article>
    </section>
</main>

<footer>
    <p>&copy; 2024 My Website. All rights reserved.</p>
</footer>
```''',
                'summary': 'Learn how to use semantic HTML5 elements for better structure and accessibility.',
                'expected_output': 'HTML Preview Rendered',
                'solution_keywords': ['<header>', '<nav>', '<main>', '<section>', '<article>', '<footer>'],
                'language': 'html',
                'order': 8
            }
        ]

        for lesson_data in lessons:
            self.create_lesson(course, **lesson_data)

    def create_javascript_lessons(self, course):
        lessons = [
            {
                'title': 'JavaScript Basics and Variables',
                'content': '''# JavaScript Basics and Variables

Welcome to JavaScript Essentials! JavaScript is the programming language of the web, making websites interactive and dynamic.

## What is JavaScript?
- A programming language that runs in web browsers
- Makes web pages interactive
- Can manipulate HTML elements and CSS styles
- Essential for modern web development

## Variables in JavaScript
JavaScript has three ways to declare variables:
- `let`: Modern variable declaration (can be reassigned)
- `const`: Constant (cannot be reassigned)
- `var`: Older way (avoid in modern code)

## Data Types
- `string`: Text in quotes
- `number`: Numeric values
- `boolean`: true or false
- `array`: List of values
- `object`: Key-value pairs

## Task
1. Create a variable called `name` with your name as a string
2. Create a variable called `age` with your age as a number
3. Create a variable called `isStudent` with value true
4. Print all three variables using console.log()

## Expected Output
```
Alice
25
true
```

## Hint
```javascript
const name = "Alice";
const age = 25;
const isStudent = true;

console.log(name);
console.log(age);
console.log(isStudent);
```''',
                'summary': 'Learn JavaScript basics and how to declare variables.',
                'expected_output': 'Alice\n25\ntrue',
                'solution_keywords': ['const', 'console.log'],
                'language': 'javascript',
                'order': 1
            },
            {
                'title': 'Strings and Template Literals',
                'content': '''# Strings and Template Literals

Strings are used to represent text in JavaScript. Modern JavaScript provides template literals for easier string formatting.

## String Basics
- Single quotes: `'Hello'`
- Double quotes: `"Hello"`
- Template literals: `` `Hello` `` (backticks)

## Template Literals
Template literals allow:
- Embedded expressions: `${variable}`
- Multi-line strings
- String interpolation

## String Methods
- `.toUpperCase()`: Convert to uppercase
- `.toLowerCase()`: Convert to lowercase
- `.length`: Get string length
- `.slice()`: Extract part of string

## Task
Create variables `firstName` and `lastName`. Use template literals to:
1. Create a full name greeting
2. Convert the greeting to uppercase
3. Print the final result

## Expected Output
```
HELLO, ALICE SMITH!
```

## Hint
```javascript
const firstName = "Alice";
const lastName = "Smith";
const greeting = `Hello, ${firstName} ${lastName}!`;
console.log(greeting.toUpperCase());
```''',
                'summary': 'Learn how to work with strings and use template literals in JavaScript.',
                'expected_output': 'HELLO, ALICE SMITH!',
                'solution_keywords': ['template literals', 'toUpperCase', '${'],
                'language': 'javascript',
                'order': 2
            },
            {
                'title': 'Arrays and Array Methods',
                'content': '''# Arrays and Array Methods

Arrays are ordered lists of values that can hold multiple items of different types.

## Creating Arrays
```javascript
const fruits = ["apple", "banana", "orange"];
const numbers = [1, 2, 3, 4, 5];
const mixed = ["text", 42, true];
```

## Common Array Methods
- `.push()`: Add item to end
- `.pop()`: Remove item from end
- `.shift()`: Remove item from beginning
- `.unshift()`: Add item to beginning
- `.length`: Get array size
- `.join()`: Convert array to string

## Accessing Elements
Array indices start from 0:
```javascript
const firstItem = fruits[0]; // "apple"
const lastItem = fruits[fruits.length - 1]; // "orange"
```

## Task
Create an array with 5 colors. Add a new color to the end, remove the first color, and print the final array as a comma-separated string.

## Expected Output
```
green,blue,yellow,purple,red
```

## Hint
```javascript
const colors = ["red", "green", "blue", "yellow", "purple"];
colors.push("red"); // Add to end
colors.shift(); // Remove first
console.log(colors.join(","));
```''',
                'summary': 'Learn how to work with arrays and common array methods in JavaScript.',
                'expected_output': 'green,blue,yellow,purple,red',
                'solution_keywords': ['push', 'shift', 'join'],
                'language': 'javascript',
                'order': 3
            },
            {
                'title': 'Objects and Properties',
                'content': '''# Objects and Properties

Objects are collections of key-value pairs and are fundamental to JavaScript programming.

## Creating Objects
```javascript
const person = {
    name: "Alice",
    age: 25,
    city: "New York"
};
```

## Accessing Properties
- Dot notation: `person.name`
- Bracket notation: `person["name"]`

## Adding and Modifying Properties
```javascript
person.email = "alice@example.com"; // Add new property
person.age = 26; // Modify existing property
```

## Object Methods
- `Object.keys()`: Get all keys
- `Object.values()`: Get all values
- `Object.entries()`: Get key-value pairs

## Task
Create a `car` object with properties: make, model, year, and isElectric. Add a color property, then print all the object values separated by spaces.

## Expected Output
```
Tesla Model 3 2023 true red
```

## Hint
```javascript
const car = {
    make: "Tesla",
    model: "Model 3",
    year: 2023,
    isElectric: true
};
car.color = "red";
console.log(Object.values(car).join(" "));
```''',
                'summary': 'Learn how to create and manipulate objects in JavaScript.',
                'expected_output': 'Tesla Model 3 2023 true red',
                'solution_keywords': ['Object', 'keys', 'values'],
                'language': 'javascript',
                'order': 4
            },
            {
                'title': 'Conditional Statements',
                'content': '''# Conditional Statements

Conditional statements allow your program to make decisions and execute different code based on conditions.

## If Statements
```javascript
if (condition) {
    // Code to run if condition is true
} else if (anotherCondition) {
    // Code to run if first condition is false and this is true
} else {
    // Code to run if all conditions are false
}
```

## Comparison Operators
- `===` : Strict equality
- `!==` : Strict inequality
- `>` : Greater than
- `<` : Less than
- `>=` : Greater than or equal
- `<=` : Less than or equal

## Logical Operators
- `&&` : AND (both conditions must be true)
- `||` : OR (at least one condition must be true)
- `!` : NOT (reverses the condition)

## Task
Create variables `age` and `hasLicense`. Write a program that prints:
- "Can drive" if age is 16 or older AND has a license
- "Too young" if age is under 16
- "Needs license" if age is 16 or older but no license

## Expected Output
```
Can drive
```

## Hint
```javascript
const age = 18;
const hasLicense = true;

if (age >= 16 && hasLicense) {
    console.log("Can drive");
} else if (age < 16) {
    console.log("Too young");
} else {
    console.log("Needs license");
}
```''',
                'summary': 'Learn how to use conditional statements to make decisions in JavaScript.',
                'expected_output': 'Can drive',
                'solution_keywords': ['if', 'else', '&&'],
                'language': 'javascript',
                'order': 5
            },
            {
                'title': 'For Loops and Iteration',
                'content': '''# For Loops and Iteration

Loops allow you to repeat code multiple times and iterate over data structures.

## For Loop Syntax
```javascript
for (let i = 0; i < 10; i++) {
    // Code to repeat
}
```

## Loop Components
- Initialization: `let i = 0`
- Condition: `i < 10`
- Increment: `i++`

## For...of Loop (Arrays)
```javascript
const fruits = ["apple", "banana", "orange"];
for (const fruit of fruits) {
    console.log(fruit);
}
```

## For...in Loop (Objects)
```javascript
const person = { name: "Alice", age: 25 };
for (const key in person) {
    console.log(key, person[key]);
}
```

## Task
Create an array of numbers from 1 to 5. Use a for loop to calculate and print the sum of all numbers.

## Expected Output
```
15
```

## Hint
```javascript
const numbers = [1, 2, 3, 4, 5];
let sum = 0;

for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
}

console.log(sum);
```''',
                'summary': 'Learn how to use for loops to repeat code and iterate over arrays.',
                'expected_output': '15',
                'solution_keywords': ['for', 'sum', 'length'],
                'language': 'javascript',
                'order': 6
            },
            {
                'title': 'Functions in JavaScript',
                'content': '''# Functions in JavaScript

Functions are reusable blocks of code that perform specific tasks. They are fundamental to JavaScript programming.

## Function Declaration
```javascript
function functionName(parameters) {
    // Code to execute
    return result;
}
```

## Function Expression
```javascript
const functionName = function(parameters) {
    // Code to execute
    return result;
};
```

## Arrow Function (Modern)
```javascript
const functionName = (parameters) => {
    // Code to execute
    return result;
};
```

## Calling Functions
```javascript
const result = functionName(argument1, argument2);
```

## Task
Create a function called `multiply` that takes two numbers and returns their product. Call the function with 4 and 5, then print the result.

## Expected Output
```
20
```

## Hint
```javascript
function multiply(a, b) {
    return a * b;
}

const result = multiply(4, 5);
console.log(result);
```''',
                'summary': 'Learn how to define and use functions in JavaScript.',
                'expected_output': '20',
                'solution_keywords': ['function', 'return', 'multiply'],
                'language': 'javascript',
                'order': 7
            },
            {
                'title': 'DOM Manipulation Basics',
                'content': '''# DOM Manipulation Basics

The Document Object Model (DOM) allows JavaScript to interact with HTML elements on a webpage.

## Selecting Elements
```javascript
// By ID
const element = document.getElementById("myId");

// By class name
const elements = document.getElementsByClassName("myClass");

// By tag name
const elements = document.getElementsByTagName("div");

// Using CSS selectors
const element = document.querySelector("#myId");
const elements = document.querySelectorAll(".myClass");
```

## Modifying Elements
```javascript
// Change text content
element.textContent = "New text";

// Change HTML content
element.innerHTML = "<strong>Bold text</strong>";

// Change styles
element.style.color = "red";
element.style.backgroundColor = "blue";
```

## Creating Elements
```javascript
const newElement = document.createElement("div");
newElement.textContent = "New element";
document.body.appendChild(newElement);
```

## Task
Since we're in a code editor environment, create a function that would manipulate a hypothetical DOM element. Write a function called `highlightElement` that takes an element id and text, then logs what it would do to the console.

## Expected Output
```
Would set element 'myText' content to: 'Hello World!'
Would add yellow background to element 'myText'
```

## Hint
```javascript
function highlightElement(elementId, text) {
    console.log(`Would set element '${elementId}' content to: '${text}'`);
    console.log(`Would add yellow background to element '${elementId}'`);
}

highlightElement("myText", "Hello World!");
```''',
                'summary': 'Learn the basics of DOM manipulation and how JavaScript interacts with HTML elements.',
                'expected_output': 'Would set element \'myText\' content to: \'Hello World!\'\nWould add yellow background to element \'myText\'',
                'solution_keywords': ['DOM', 'element', 'highlightElement'],
                'language': 'javascript',
                'order': 8
            }
        ]

        for lesson_data in lessons:
            self.create_lesson(course, **lesson_data)
