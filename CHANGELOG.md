## 0.1.0 (2026-10-05)

### 🩹 Fixes

- set page title ([2965ca8](https://github.com/WittmannD/imageboard/commit/2965ca8))
- change domain for the development env ([b1700da](https://github.com/WittmannD/imageboard/commit/b1700da))
- post`s photo carousel should disable swiping and hide navigation arrows if there is only one photo ([f8b5823](https://github.com/WittmannD/imageboard/commit/f8b5823))
- zoom component measured during parent transform animation and got invalid values ([bbafaae](https://github.com/WittmannD/imageboard/commit/bbafaae))
- post creation date label is slightly shifted down ([33b0974](https://github.com/WittmannD/imageboard/commit/33b0974))
- lint and prettier errors ([bd9ca15](https://github.com/WittmannD/imageboard/commit/bd9ca15))
- lint and prettier errors ([9f5a321](https://github.com/WittmannD/imageboard/commit/9f5a321))

### 🚀 Features

- display relative post creation time ([45e0a57](https://github.com/WittmannD/imageboard/commit/45e0a57))
- add stricter validation rules for usernames ([e1b6082](https://github.com/WittmannD/imageboard/commit/e1b6082))
- add password validation ([0e1281a](https://github.com/WittmannD/imageboard/commit/0e1281a))
- add ability to zoom post photos ([7061d1a](https://github.com/WittmannD/imageboard/commit/7061d1a))
- improve yaml-template package; move the image transformation config directory from the source code to the images source bucket ([b531e55](https://github.com/WittmannD/imageboard/commit/b531e55))
- move image transform configs to s3 bucket; add deployment step to update transform configs on s3 bucket ([9ae0f0e](https://github.com/WittmannD/imageboard/commit/9ae0f0e))
- add releases ([baa7037](https://github.com/WittmannD/imageboard/commit/baa7037))
- **api:** add an endpoint to get one user`s published posts; add ability for author to get their unpublished posts ([5bcb506](https://github.com/WittmannD/imageboard/commit/5bcb506))
- **api:** add an endpoint for changing post status ([4d61e7b](https://github.com/WittmannD/imageboard/commit/4d61e7b))
- **api:** add an endpoint to fetch one post ([7501f2e](https://github.com/WittmannD/imageboard/commit/7501f2e))
- **client:** add ability to archive posts and recovery them; add feed of recent posts create by user to the user page; add post actions menu and empty feed placeholder ([1df4067](https://github.com/WittmannD/imageboard/commit/1df4067))