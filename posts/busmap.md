**If you just want to look at the bus map, click [here](/ukbusmap). If you want the raw 14m/px 60420×76720 bus map, click [here](/busmap-dzi/ukbusmap.png) (this will not display on a regular browser or image viewer)**

### Initial Idea

Before this project there was no full bus map of the UK (at least, not that I could find), there are some impressive projects that are higher quality than my maps but are all incomplete such as [this project](https://busatlas.uk/) and [this Reddit post](https://www.reddit.com/r/TransitDiagrams/comments/1dem62y/oc_my_current_progress_on_a_full_bus_map_of_the_uk/). These manually created maps look much cleaner and have clearer labels, but are incomplete and quickly become outdated. There is also the [bustimes.org map](https://bustimes.org/map) which shows all currently tracking buses.

The aim of this project is to create a map of the whole country that can be updated automatically.

---

### Terminology

- Geometry - The geometry of a route is the line which is drawn on the map to represent where the buses drive.
- Trip - A specific journey made by a bus.
- DRT/Demand Responsive Transit - A service where you book a minibus like a taxi, then the minibus will take you door to door, collecting and dropping off other passengers along the route which is dynamically calculated. These work best when run alongside a developed bus network to provide service to less developed areas such as small villages.
- BBox/Bounding Box - The area representing where a route operates or where a map will be rendered.

---

### Data Issues

The first part of this project was to acquire the data needed to generate the map. The most reliable source of bus data in the UK is bustimes.org which pulls data from the many different sources and makes them available in its API. While the data on bustimes.org is very good, there are a few issues with the data that are quite annoying for this project:

1. Not all operators publish route geometry data, bustimes.org will still generate geometry data based on the stopping pattern in these cases, but this results in straight lines being drawn between stops which looks really ugly on the map.
2. Some geometry data is a complete mess, many routes are missing geometry for part of the route and some DRT operators publish data as if it were a normal service, with hilarious results.
3. There is no easily parsable data on bus frequencies or geometry, only a massive list of all the trips made by buses which does contain this information, but its a pain to parse for this purpose.
4. Timetables sometimes suggest that a single bus is actually multiple buses that require a change.
5. There is no data on the operators brand colors.

By far the worst offender for not publishing geometry data is National Express. In the end I had to exclude them as well as a few other operators from the map to avoid straight lines being drawn all over the map:

![A bus map of some national express routesd with no geometry](/natx-routes.png)

Arriva also does not publish geometry data which is fine for most of their routes with frequent stops but they operate a few long distance routes which draw long lines on the map, this is why the map has an arriva colored triangle just north of london:

![A bus map of north west london where there is a triangular shaped arriva route](/arriva-triangle.png)

DRTs really mess up the geometry data, this is because they publish timetables as if they are normal buses, but since they have no fixed route, the geometry makes no sense:

![A bus map of a single DRT route that looks like spaghetti](/56h-drt-map.png)

The worst case of this is Lincolnshire's CallConnect service, which I completely excluded from the final map to prevent Lincolnshire from looking like this:

![A bus map showing DRT routes that look like spaghetti](/drt-map.png)

The trips API on bustimes.org isnt really suitable for generating a bus map, its far too much data in a format that is difficult to extract timetable data from, which will be used to exaggerate more frequent routes in the final map. This leaves scraping the bustimes.org website as the only option. Conveniently, theres a [sitemap file](https://bustimes.org/sitemap-services.xml) with links to all the service pages on it.

Each service page has 2 tables with all the trips, to calculate the frequency of a route (services per day), we can count the total number of columns in these tables. This method of calculating timetables isnt perfect, some routes have timetables that would suggest you have to change buses in the middle so each trip is displayed on the timetable as 2 trips. This can cause some routes to be more prominent on the map than they should be. The service pages also contain the bounding boxes for each route and the service ID.

The operator for each route can be extracted from the [bustimes.org services API](https://bustimes.org/api/services/?format=json&limit=1000000) which bustimes.org conveniently allows us to download all in one go.

Geometry data also exists in the trips API buts its in a really awkward format. Thankfully bustimes.org has already parsed it for us and uses it to draw its route maps. We can scrape this data from bustimes.org using the service IDs, which are sequential. Annoyingly, this geometry data flips the longitude and latitude.

I had to create the operator colors data myself, the big operators (like stagecoach) were easy since I could apply a single color to a huge number of services, but the smaller operators were very time consuming to put together data for. Where operators had a website, I would use the main color on that website, otherwise I would look at photos of their buses and use the color of the livery. In a few cases I had to just make something up. The main purpose of the operator colors is to differentiate operators, its not a perfect representation of their brand colors.

---

### The Script

The script is 100% Python and uses Pygame to visualise drawing the map. At the end of the script, it takes a screenshot of the window and saves it as an image. This is not the most optimal way of generating the map but it is cool watching it draw the routes. I also implemented a fancy terminal UI to prompt the user to download data if it is missing and display the progress of the bus map generator.

The script loops through the list of routes (which is ordered by frequency), then filters and draws them on the Pygame window based on that route's geometry file and the configuration set at the start of the script.

The script will then draw city and route labels, I usually disable city labels as they look quite ugly, but if you want to use this as a useful map I would suggest enabling them. Route labels are drawn once per route, their position is calculated as the middle of the route based on the geometry data, but as the geometry often has 2 lines, one outward and one return, the route labels often get drawn at the ends of routes because the "middle" is actually near where the bus turns around.

You can download the script [here](https://github.com/verumIgnis/busmapgen).

---

### Rendering and displaying a detailed map

I wanted to create a full highly detailed map of the UK, however pygame would fail to open a window that large (since the script renders the map in a window, then saves a screenshot), even if it didnt, I would quickly run out of RAM. The workaround was to render the map in a 4x5 grid of tiles at 14m/px, resulting in 20 images like this:

![Example of a map tile](/tile-example.png)

I then combined them into one image, but the resulting image was 60420×76720 which was far too big to render in any normal image viewer.

![Screenshot of error "There is not enough free memory available to load this image."](/load-error.png)

To solve this I split the image into tiles and set up [OpenSeaDragon](https://openseadragon.github.io/) to render them, which you can view [here](/ukbusmap).

---

### What Next?

The biggest thing I would like to implement is map tiles, this would mean the bus map would be drawn over a map of the roads.

I would also like to clean up the geometry data more, perhaps by using tracking data to work out exactly which roads are used by the buses, then using openstreetmap data to create a nice clean line along that road. This would allow me to display NATX on the map.

I would also like to improve how route labels are drawn, they currently overlap a lot making them hard to read and tell which route they actually belong to.

---

### Example

**For the full bus map, click [here](/ukbusmap).**

![Full UK bus map](/busmap-example.png)