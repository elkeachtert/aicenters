# MCML Website

## Building locally

To work locally with this project, you'll have to follow the steps below:

1. `Install` Hugo (e.g. from apt-get)
1. Fork, clone or download this project.
   Be carefull to include submodules (This should automatically work).
1. `cd` into the directory
1. Preview your project: `hugo server`
1. Add content
1. Generate the website: `hugo` (optional)

Read more at Hugo's [documentation][].

### Preview your site

If you clone or download this project to your local computer and run `hugo server`,
your site can be accessed under `localhost:1313/hugo/`.


## Modify Content

All content resides in the `config.toml`
All .htmls reside in the `layouts` folder.


## Add Images

Images reside in **static/images/<subsite>**


## Help

- (Hugo Directory Structure)[https://gohugo.io/getting-started/directory-structure/]

<!-- hugo server --bind=ip --baseURL=http://ip -->
