# Smoky Mountain Acres

Eleventy static site deployed on Netlify (`npm run build` outputs to `_site`).

## Farm Inventory CMS

### Where content lives
Each animal is one JSON file in `content/animals/` (for example `content/animals/pip.json`). Fields: `name`, `animal_type`, `breed`, `sex`, `birth_date`, `price`, `description`, `image`, `available`, `featured`, `order`. Only `name` is required.

### How the inventory page reads it
`_data/livestock.js` reads every file in `content/animals/` at build time. It keeps animals with `available: true`, then sorts featured first, then by `order` (lower first, blank last), then by name. [from-the-farm/livestock-inventory.njk](from-the-farm/livestock-inventory.njk) renders the cards as static HTML using the original `team` card markup. Optional fields (breed, price, description, image) are omitted when empty, and a photo that fails to load is hidden.

### How /admin works
`admin/index.html` loads Decap CMS from a CDN and `admin/config.yml` defines an **Animals** collection. Eleventy copies `admin/` to the built site. Visit `/admin/` and sign in with GitHub.

### Adding, editing and removing animals
1. Open `/admin/` and choose **Animals**.
2. **New Animal** to add, click an animal to edit, or use **Delete entry** inside an animal to remove it.
3. Untick **Available** to hide an animal without deleting it. Tick **Featured** to list it first.
4. Click **Publish**.

### Images
Uploaded photos go to `assets/img/inventory/` and are referenced as `/assets/img/inventory/<file>`. Existing photos in `boys/` and `girls/` keep working. Use WebP or reasonably sized JPEGs.

### Authentication (manual setup required)
Git Gateway is not used. The config uses the Decap `github` backend with Netlify's OAuth provider. No secrets are in the repository. You must configure:

1. GitHub: Settings > Developer settings > OAuth Apps > **New OAuth App**.
   - Homepage URL: your site URL.
   - Authorization callback URL: `https://api.netlify.com/auth/done`.
   - Generate a client secret.
2. Netlify: Site configuration > Access & security > **OAuth** > Install provider > GitHub. Enter the Client ID and Client Secret.
3. Every editor needs a GitHub account with write access to `Thomas-Web-Group/SmokyMountainAcres`.
4. If the repository, owner or branch changes, update `repo` and `branch` in `admin/config.yml`.

### Testing locally
1. Uncomment `local_backend: true` in `admin/config.yml` (do not commit it).
2. Run `npx decap-server` in one terminal and `npm start` in another.
3. Open `http://localhost:8080/admin/`. Changes are written to local files, with no GitHub login.
4. The dev server can cache inventory data, so restart `npm start` to see CMS edits on the inventory page.

### Publishing flow
Clicking **Publish** makes Decap commit the JSON file (and any image) directly to `main` on GitHub. Netlify detects the commit, runs the build, and deploys the updated inventory page, usually within a couple of minutes. The Netlify build must be able to run Eleventy as it does today.
