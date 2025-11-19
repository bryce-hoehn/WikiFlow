# Media URL Construction Test Results

## Test Summary

The `Special:FilePath` redirect endpoint approach has been tested and confirmed to work correctly.

## Test Results

### ✅ Working Examples

1. **Simple filename:**

   - Input: `Example.ogg`
   - URL: `https://commons.wikimedia.org/wiki/Special:FilePath/Example.ogg`
   - Redirect chain: `Special:FilePath` → `Special:Redirect/file` → `upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg`
   - Final Status: **200 OK**

2. **Real Wikipedia file:**

   - Input: `En-LudwigVanBeethoven.ogg`
   - URL: `https://commons.wikimedia.org/wiki/Special:FilePath/En-LudwigVanBeethoven.ogg`
   - Redirect chain: `Special:FilePath` → `Special:Redirect/file` → `upload.wikimedia.org/wikipedia/commons/c/c7/En-LudwigVanBeethoven.ogg`
   - Final Status: **200 OK**

3. **File with special characters:**
   - Input: `Klaviersonate_Nr._32_c-mollr_op._111_-_I._Maestoso,_Allegro_con_brio_ed_appassionato.ogg`
   - URL: `https://commons.wikimedia.org/wiki/Special:FilePath/Klaviersonate_Nr._32_c-mollr_op._111_-_I._Maestoso%2C_Allegro_con_brio_ed_appassionato.ogg`
   - Final Status: **200 OK**

### ⚠️ Important Notes

1. **File: prefix must be removed:**

   - ❌ `File:Example.ogg` → 404 (because actual filename doesn't include "File:")
   - ✅ `Example.ogg` → 200 OK
   - The code correctly strips the "File:" prefix in `constructCommonsFileUrl()`

2. **Spaces are converted to underscores:**

   - The code replaces spaces with underscores before encoding
   - Example: `Beethoven's 5th Symphony.ogg` → `Beethoven's_5th_Symphony.ogg`

3. **URL encoding:**
   - Special characters are properly URL-encoded using `encodeURIComponent()`
   - Example: `,` becomes `%2C`

## Redirect Chain

The `Special:FilePath` endpoint uses a two-step redirect:

1. `https://commons.wikimedia.org/wiki/Special:FilePath/{filename}`
   → Redirects to
2. `https://commons.wikimedia.org/wiki/Special:Redirect/file/{filename}`
   → Redirects to
3. `https://upload.wikimedia.org/wikipedia/commons/{hash_path}/{filename}`

## Code Verification

The current implementation in `MediaPlayer.tsx`:

1. ✅ Correctly extracts filename from various patterns (`File:`, `/wiki/File:`, etc.)
2. ✅ Strips "File:" prefix if present
3. ✅ Replaces spaces with underscores
4. ✅ URL-encodes the filename properly
5. ✅ Uses `Special:FilePath` redirect endpoint

## Browser Compatibility

- ✅ Web browsers successfully follow the redirect chain
- ✅ Media players (HTML5 `<audio>` and `<video>`) should follow redirects
- ⚠️ Some native media players may not follow redirects - if issues occur, we may need to resolve the final URL server-side

## Conclusion

The URL construction using `Special:FilePath` redirect endpoint is **working correctly** and should resolve the 404 errors for media files.
