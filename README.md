## mapsense.js documentation pages

###gh-pages branch
gh-pages branch is reserved to store static Web pages in github.

You can find more information here [Creating Project Pages manually - User Documentation] (https://help.github.com/articles/creating-project-pages-manually/)

To summarize, here are the steps to follow:

1. Create an orphan gh-pages branch => git checkout --orphan gh-pages
2. Remove all files in the branch => git rm -rf .
3. Copy-paste your static Web pages in the folder with the default file named index.html
4. Psuh your changes on github gh-pages branch => git push -f origin gh-pages

You should be able to see your change at http://&lt;username&gt;.github.io/&lt;projectname&gt;; in our case, http://mapsense.github.io/mapsense.js/

###Documentation generator
We are using **_middleman_** to generate the mapsense.js documentation, you can find the code in this repo.: [mapsense.js-documentation] (https://github.com/WillySuMapSense/mapsense.js-documentation)
#####NOTE: Need to transfer this repo. from WillySuMapSense to mapsense


To generate or to modify the documentation content

1. Make your changes on the branch
2. Remove build folder => rm -rf build
3. Generate the new content => middleman build

The new content will be in the folder **build**

Copy-paste the new content from the branch documentation-page-only of developer-tools to the branch gh-pages of mapsense.js

Commit your changes in the branch gh-pages of mapsense.js, then you should be able to see the updated documentation page in http://mapsense.github.io/mapsense.js/

