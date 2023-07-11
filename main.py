import os
from PIL import Image

# Modify contents to test image compression

# extensions of files to modify
extensions = ['.jpg', '.jpeg', '.png', '.webp']

# walk through all files in the current directory
for root, dirs, files in os.walk('.'):
    for file in files:
        if any(file.endswith(ext) for ext in extensions):
            # open image file
            img = Image.open(os.path.join(root, file))
            # save the image back to the same file, which should change its last modification time and contents
            img.save(os.path.join(root, file))
