# Async Task Dispatch with Long Polling - Step by Step Explained

講解如何處理 long running time 嘅 task。

當一個 task 要用較長時間處理，ajax request 有機會 timeout。
這個情況 server 要在收到 request 時直接 response 一個 task id，然後 client 可以用這個 id 來接收結果。
這個 repo 示範如何用 long polling 來實現這個流程。

This repo demo how to build a system to process task that could take long time to process.
The long processing time may cause the request to timeout if implemented as typical request/response model.
In this case, the server can response a task id immediately after it received the task request, the client can then retrieve the task result with subsequence requests. This repo used "Long Polling" technique to reduce the overhead while the task is still processing in the background.

Video Recording: https://youtu.be/lepESjIhMwM
