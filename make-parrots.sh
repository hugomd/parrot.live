#!/bin/bash
set -x

# generates all the parrot gifs
# Requirements: wget, ImageMagick, image2ascii

mkdir -p /tmp/parrots;
cd /tmp/parrots
rm -rf ./*

wget https://cultofthepartyparrot.com/ -O /tmp/parrots/parrot.html

imgs=$(cat /tmp/parrots/parrot.html | grep -o '<img .*src=.*>' | sed -e 's/<img .*src=['"'"'"]//' -e 's/["'"'"'].*$//' -e '/^$/ d' | grep '.gif$' | grep '^/parrots/' | sort | grep -v [0-9])
echo "imgs = $imgs"

for img in $imgs; do
    cd /tmp/parrots
    file=$(basename $img);
    if [ -f /tmp/parrots/$img ]; then
        continue;
    fi
    rm -f *.gif
    wget "http://cultofthepartyparrot.com$img";

    outdir=$(echo -n $file | sed 's/.gif//' | sed 's/parrot//' | sed 's/[-_]//g')
    mkdir -p /tmp/parrots/$outdir
    cd /tmp/parrots/$outdir
    rm -f *.txt *.png
    convert ../$file output.png

    for x in *.png; do
        outfile=$(echo -n $x | sed 's/.png//' | sed 's/output-//')
        image2ascii -f $x -w=50 -g=25 > ./$outfile.txt;
    done;
    rm -f *.png
done;

