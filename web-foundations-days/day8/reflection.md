# Day 8 Reflection

The most difficult concept in this course was designing a system that handles many users trying to access the same resource at the same time. I initially found it challenging to understand how database transactions, row locks, and constraints work together to prevent double-booking. I overcame this by breaking the process into smaller steps and studying how a transaction checks availability, locks a seat, and commits a reservation. Applying these concepts to TicketHub helped me understand why correctness is more important than accepting every request immediately.

Based on the feedback I received on my capstone, I would improve the architecture documentation by making the request flows and component responsibilities clearer. I would also strengthen the testing section by including more examples of error handling, validation, and concurrent requests. This would make the project easier for another developer to understand and maintain.

Next, I plan to learn more about backend development, especially database transactions, authentication, and API testing. I also want to practise deploying applications and using tools that monitor performance. These skills will help me build more reliable applications and understand how systems behave when real users access them at scale.
