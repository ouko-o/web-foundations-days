
# SnapShare: Photo-Sharing App Scaling Plan

## 1. Assumptions

SnapShare is a photo-sharing application where users upload photos and view a feed containing photos from people they follow.

The design uses the following assumptions:

- The application has 10 million registered users.
- 10% of registered users are active daily.
- Each daily active user uploads one photo per day.
- Each daily active user views 50 feed pages per day.
- Each original photo is 2 MB.
- Each photo has one thumbnail of 50 KB.
- A day has 86,400 seconds, and a year has 365 days.
- Average traffic is distributed evenly across 24 hours.
- Peak feed-view traffic is five times the average traffic.
- Storage calculations use decimal units: 1 TB = 1,000 GB and 1 GB = 1,000 MB.
- Storage estimates exclude replication, backups, metadata, and other overhead.
- Feed pages may contain multiple photos, so feed-page views are not the same as individual photo requests.

## 2. Traffic and Storage Estimates

### Daily Active Users

Daily active users are 10% of the 10 million registered users.

10,000,000 × 0.10 = 1,000,000 daily active users.

Therefore, SnapShare has an estimated 1 million daily active users.

### Photo Uploads Per Second

Each daily active user uploads one photo per day.

Daily uploads:

1,000,000 × 1 = 1,000,000 uploads per day.

Average uploads per second:

1,000,000 ÷ 86,400 ≈ 11.57 uploads per second.

Therefore, SnapShare receives approximately 12 uploads per second on average.

### Feed Views Per Second

Each daily active user views 50 feed pages per day.

Daily feed views:

1,000,000 × 50 = 50,000,000 feed views per day.

Average feed views per second:

50,000,000 ÷ 86,400 ≈ 578.7 feed views per second.

Peak feed views per second use a factor of five:

578.7 × 5 ≈ 2,894 feed views per second.

SnapShare should therefore plan for approximately 579 average feed views per second and 2,894 peak feed views per second. Actual capacity planning should also consider traffic bursts and the number of photos requested per feed page.

### Photo Storage Per Year

Each upload produces an original photo and a thumbnail.

Original photo storage per day:

1,000,000 × 2 MB = 2,000,000 MB = 2,000 GB = 2 TB.

Thumbnail storage per day:

1,000,000 × 50 KB = 50,000,000 KB = 50 GB.

Total storage per day:

2,000 GB + 50 GB = 2,050 GB = 2.05 TB.

Total storage per year:

2.05 TB × 365 = 748.25 TB per year.

SnapShare therefore needs approximately 748.25 TB of additional photo storage per year before accounting for backups, replicas, metadata, and other overhead.

## 3. Read-Heavy or Write-Heavy?

SnapShare is a read-heavy system because each active user views 50 feed pages per day but uploads only one photo per day. Feed views occur much more frequently than photo uploads.

The architecture should prioritize fast reads and photo delivery. A content delivery network (CDN) can serve cached photos close to users, a cache can reduce repeated database queries, and a database read replica can handle read queries without putting all the load on the primary database.

Uploads still need to be reliable, so a queue and background worker will process thumbnail creation asynchronously.

## 4. Where Photos Should Be Stored

Photo files should be stored in object storage rather than directly inside the relational database.

Object storage is designed to store large files at scale and can provide durable storage, high capacity, and integration with a CDN. Storing photo binaries in the database would increase its size, backups, and query workload.

The database should store photo metadata, such as the photo ID, owner ID, object-storage key, upload time, caption, and visibility settings. The actual original and thumbnail files should be stored in object storage.

## 5. Architecture Diagram

```text
                         +------------------+
                         |      Users       |
                         +------------------+
                                  |
                                  v
                         +------------------+
                         |       CDN        |
                         | Cached photo and |
                         | thumbnail files  |
                         +------------------+
                                  |
                         Cache miss / API
                                  |
                                  v
                         +------------------+
                         |  Load Balancer   |
                         +------------------+
                                  |
                   +--------------+--------------+
                   |              |              |
                   v              v              v
             +-----------+  +-----------+  +-----------+
             | App Server|  | App Server|  | App Server|
             |     1     |  |     2     |  |     3     |
             +-----------+  +-----------+  +-----------+
                   |              |              |
                   +--------------+--------------+
                                  |
                +-----------------+------------------+
                |                 |                  |
                v                 v                  v
          +-----------+    +-------------+    +----------------+
          |   Cache   |    |  Primary DB |    | Object Storage |
          | Feed data |    | Users, posts|    | Original photos|
          | and common|    | and metadata|    | and thumbnails |
          | queries   |    +-------------+    +----------------+
          +-----------+           |
                                  | Replication
                                  v
                           +-------------+
                           | Read Replica|
                           | Feed queries|
                           +-------------+

          Upload processing:
          App Server
               |
               v
          +-----------+
          |   Queue   |
          | Thumbnail |
          |   jobs    |
          +-----------+
               |
               v
          +-----------+
          |  Worker   |
          | Generates |
          | thumbnail |
          +-----------+
               |
               v
          +----------------+
          | Object Storage |
          | Saves thumbnail|
          +----------------+
```

## 6. Components and the Problems They Solve

- **CDN:** Delivers cached photos and thumbnails from locations closer to users, reducing latency and origin-server traffic.
- **Load balancer:** Distributes incoming requests across app servers so one server does not handle all traffic.
- **App servers:** Process application logic, authenticate users, handle uploads, and assemble feed responses.
- **Cache:** Keeps frequently accessed feed data and other reusable results in fast memory to reduce repeated database work.
- **Primary database:** Stores authoritative user, post, follow, and photo metadata and handles writes.
- **Read replica:** Serves suitable read queries to reduce load on the primary database.
- **Object storage:** Stores original photos and generated thumbnails without placing large binary files in database rows.
- **Queue:** Holds thumbnail-generation jobs so uploading a photo does not have to wait for image processing to finish.
- **Worker:** Retrieves queued jobs, generates thumbnails, and saves them to object storage.

## 7. Photo Upload Flow

1. A user selects a photo and submits it through the SnapShare application.
2. The request reaches the load balancer, which routes it to an available app server.
3. The app server authenticates the user and validates the file type, file size, and upload permissions.
4. The app server stores the original photo in object storage and obtains its storage key.
5. The app server writes the photo metadata, including the owner, storage key, and upload time, to the primary database.
6. The app server adds a thumbnail-generation job to the queue.
7. The app server returns an upload-success response after the original file and required metadata have been stored and the job has been queued.
8. A background worker retrieves the job and generates a smaller thumbnail from the original photo.
9. The worker saves the thumbnail in object storage and updates any required processing status.
10. The CDN can deliver the original photo and thumbnail to users, using caching where appropriate.

The queue allows thumbnail processing to happen asynchronously. If a worker is temporarily unavailable, the job can remain queued for later processing, with retries and monitoring configured to handle failures.

## 8. Trade-Offs

### Trade-Off 1: CDN Caching vs. Freshness

A CDN improves photo delivery speed and reduces traffic reaching the application and object storage. However, cached content can become stale if a photo is deleted, replaced, or its visibility changes. SnapShare must use suitable cache expiration, invalidation, and authorization rules.

### Trade-Off 2: Database Read Replicas vs. Consistency

Read replicas improve read capacity by distributing feed and metadata queries. However, replication can lag behind the primary database, so a user may not immediately see a newly uploaded photo or updated metadata when reading from a replica. Recent writes can be read from the primary when stronger consistency is needed.

### Trade-Off 3: Asynchronous Thumbnails vs. Immediate Availability

A queue and background worker keep uploads responsive because thumbnail generation does not block the upload request. However, thumbnails may not be ready immediately, and the application needs a pending state, retry handling, and monitoring for failed jobs.

### Trade-Off 4: Object Storage vs. Operational Complexity

Object storage scales well for large photo collections and separates media files from database metadata. However, the application must manage storage keys, permissions, file lifecycle policies, and consistency between database records and stored files.

## 9. Conclusion

SnapShare should use horizontally scalable app servers, a CDN, caching, database read replicas, and object storage to support frequent feed reads and large photo volumes. A queue and background worker allow thumbnail creation to happen independently of uploads. The estimated workload is about 1 million daily active users, 11.57 uploads per second on average, 578.7 feed views per second on average, and 748.25 TB of new photo storage per year before overhead.
```

## Task 3: Check your file

Before committing, verify the following:

- [ ] The file is saved as `day7/photo-app-scaling.md`.
- [ ] It includes all the assumptions and calculations.
- [ ] The architecture diagram includes every required component.
- [ ] Each component has a sentence explaining its purpose.
- [ ] The upload flow includes the queue and thumbnail worker.
- [ ] At least two trade-offs are explained.

## Task 4: Commit and push

Open Git Bash in your existing `web-foundations-days` repository and run:

```bash
git status
git add day7/photo-app-scaling.md
git commit -m "Day 7 assignment"
git push
```

If your `day7` folder is new, Git will include the Markdown file once it is staged.

Finally, verify that `day7/photo-app-scaling.md` appears on GitHub and that the commit is visible.

**One important point for your presentation:** be ready to explain why SnapShare is read-heavy, why photo files belong in object storage instead of the database, and how the queue prevents thumbnail processing from slowing down uploads.