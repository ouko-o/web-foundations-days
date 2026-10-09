
# Library Books REST API Design

## Overview

This document describes a REST API for managing books in a library. The resource is `books`, and the examples use the base URL `https://api.example.com`.

## Endpoints

### 1. List all books

- **Method:** GET
- **Path:** `/books`
- **Description:** Retrieves all books in the library.
- **Example request body:** None.
- **Success status:** `200 OK`

### 2. Get one book

- **Method:** GET
- **Path:** `/books/{id}`
- **Description:** Retrieves a single book using its unique ID.
- **Example request body:** None.
- **Success status:** `200 OK`

### 3. Create a book

- **Method:** POST
- **Path:** `/books`
- **Description:** Adds a new book to the library.
- **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958
}
```

- **Success status:** `201 Created`

### 4. Update a book

- **Method:** PUT
- **Path:** `/books/{id}`
- **Description:** Replaces the details of an existing book.
- **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958
}
```

- **Success status:** `200 OK`

### 5. Delete a book

- **Method:** DELETE
- **Path:** `/books/{id}`
- **Description:** Deletes a book using its unique ID.
- **Example request body:** None.
- **Success status:** `204 No Content`

### 6. List books by author

- **Method:** GET
- **Path:** `/books?author=Chinua%20Achebe`
- **Description:** Retrieves books written by the specified author.
- **Example request body:** None. The author is provided as a query parameter.
- **Success status:** `200 OK`

## Error Responses

### 400 Bad Request

- **Description:** The request contains invalid data.
- **Example:** A request to create a book is missing the required `title` field.

### 404 Not Found

- **Description:** The requested resource does not exist.
- **Example:** A request to `GET /books/999` asks for a book whose ID is not in the library.

## Notes

- The API uses standard HTTP methods to perform operations on books.
- JSON is used for request bodies and responses where applicable.
- The server should validate incoming data before creating or updating books.