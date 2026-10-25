@echo off
rem ONE-CLICK UPDATE for the website.
rem  1) adds the photos you put in the photos-to-add folders (shrinks them, removes location data)
rem  2) rebuilds the website files and copies them into your GitHub folder
rem Then open GitHub Desktop, write a summary, click "Commit to main", then "Push origin".
rem If your GitHub folder is somewhere else, change the REPO line below.
set "REPO=C:\Users\User\Downloads\files\year-end-outing"
cd /d "%~dp0"
python -c "import PIL" 2>nul || python -m pip install pillow
python tools/add_photos.py
python tools/make_site_folder.py "%REPO%"
echo.
echo Finished. Now open GitHub Desktop: Commit to main, then Push origin.
pause
