#!/bin/bash

# deploys site '_site' to new gh-pages branch

# check if a git repo or not
if [ git rev-parse --is-inside-work-tree ]
then
    echo "We're in a Git Repository"
else
    echo "No Repo yet"
    git init
fi

if [ git remote ]
then 
    echo "we have remote"
else
    git remote add origin https://github.com/mynimi/bla.git
fi

# delete gh-pages if it exists
if [ git rev-parse --verify --quiet gh-pages ]
then
    git branch -D gh-pages
else
    echo "no gh-pages branch so far"
fi

# new gh-pages
git checkout -b gh-pages

# remove _site from gitignore
sed -i '/_site/d' .gitignore
git add -A
git commit -m "add _site"

# force _site to be root
git filter-branch --subdirectory-filter _site/ -f

git push -f origin gh-pages

# Checkout the source branch:
git checkout source