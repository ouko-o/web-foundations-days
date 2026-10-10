
# School Database Design

## 1. Students Table

The `students` table stores information about each student. It contains a unique student ID, the student's full name, and their email address. The student ID is the primary key, and the email address must be unique so that two students cannot register with the same email.

## 2. Courses Table

The `courses` table stores information about courses offered by the school. Each course has a unique course ID, a course name, and an optional description. The course ID is the primary key.

## 3. Enrolments Table

The `enrolments` table records which students are taking which courses. It contains an enrolment ID, a student ID, a course ID, and a grade. The student ID and course ID are foreign keys that reference the `students` and `courses` tables.

The combination of student ID and course ID is unique, preventing the same student from enrolling in the same course more than once.

## Relationships Between Tables

### One-to-Many Relationships

The relationship between `students` and `enrolments` is one-to-many because one student can have multiple enrolment records, while each enrolment belongs to one student.

The relationship between `courses` and `enrolments` is also one-to-many because one course can have many students enrolled in it, while each enrolment record refers to one course.

### Many-to-Many Relationship

Students and courses have a many-to-many relationship. A student can take multiple courses, and a course can have multiple students. The `enrolments` table is necessary as a join table to represent this relationship. It also stores information specific to each enrolment, such as the student's grade in that course.

## Index

I would add an index on `enrolments.course_id`. This index can improve queries that search for all students enrolled in a particular course, especially as the number of enrolment records increases.

## SQL or NoSQL?

I would choose a relational SQL database such as SQLite for this school system. Students, courses, and enrolments have clear relationships, and foreign keys help maintain data integrity. SQL also supports joins, grouping, counting, and updating grades efficiently. A NoSQL database could be useful for more flexible or irregular data, but a relational database is a better fit for these structured records and the school's reporting requirements.
