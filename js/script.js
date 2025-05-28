/* Initialize jQuery when the DOM is fully loaded */
$(document).ready(function () {
  /* Theme Toggle Functionality */
  // Select HTML element and theme toggle button/icon
  const $html = $('html');
  const $themeToggle = $('#themeToggle');
  const $toggleIcon = $themeToggle.find('i');

  // Load saved theme from localStorage, default to 'light'
  const savedTheme = localStorage.getItem('theme') || 'light';
  $html.attr('data-theme', savedTheme);
  // Set toggle icon: cloud-moon for light mode, mountain-sun for dark mode
  $toggleIcon.toggleClass('fa-solid fa-cloud-moon', savedTheme === 'light').toggleClass('fa-solid fa-mountain-sun', savedTheme === 'dark');

  // Toggle theme on button click
  $themeToggle.on('click', function () {
    const currentTheme = $html.attr('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    $html.attr('data-theme', newTheme); // Update theme attribute
    localStorage.setItem('theme', newTheme); // Save to localStorage
    // Update toggle icon based on new theme
    $toggleIcon.toggleClass('fa-solid fa-cloud-moon', newTheme === 'light').toggleClass('fa-solid fa-mountain-sun', newTheme === 'dark');
  });

  /* Data Fetching and Table Initialization */
  // Show loading spinner and hide table initially
  $('.spinner').show();
  $('#releaseTable').hide();

  // Fetch JSON data from external URL
  $.ajax({
    url: 'https://raw.githubusercontent.com/nayeemch/release-note-searcher/refs/heads/main/all-releases.json',
    method: 'GET',
    dataType: 'json',
    success: function (data) {
      try {
        // Validate JSON data is an array
        if (!Array.isArray(data)) {
          throw new Error('Invalid JSON data: Expected an array');
        }

        // Hide spinner and show table
        $('.spinner').hide();
        $('#releaseTable').show();

        // Populate table with JSON data
        const tableBody = $('#releaseTable tbody');
        data.forEach(item => {
          // Create changelog list with first-letter markers
          const contentList = item.changelogcontent.map(log => {
            // Get first letter (uppercase) or '?' if empty
            const firstLetter = log.trim().charAt(0).toUpperCase() || '?';
            return `<li data-first-letter="${firstLetter}">${log}</li>`;
          }).join('');
          const contentHtml = `<ul>${contentList}</ul>`;

          // Append row to table with fallback for missing fields
          tableBody.append(`
            <tr>
              <td data-label="Product">${item.product || ''}</td>
              <td data-label="Version">${item.version || ''}</td>
              <td data-label="Date">${item.date || ''}</td>
              <td data-label="Changelog">${contentHtml}</td>
            </tr>
          `);
        });

        // Initialize DataTable for sorting, searching, and pagination
        const table = $('#releaseTable').DataTable({
          pageLength: 10, // Show 10 rows per page
          order: [[2, 'desc']], // Sort by Date (column 2) descending
          columnDefs: [
            { targets: 3, orderable: false }, // Disable sorting on Changelog
            {
              targets: 3, // Changelog column
              searchable: true,
              render: function (data, type, row) {
                // Strip HTML for search indexing
                if (type === 'filter' || type === 'sort') {
                  return $('<div>').html(data).text();
                }
                return data; // Display HTML for rendering
              }
            }
          ]
        });

        /* Search Highlighting */
        // Apply highlighting on table redraw (e.g., after search or sort)
        table.on('draw', function () {
          // Get search term from input
          const searchTerm = $('.dataTables_filter input').val().trim();
          const $tableBody = $('#releaseTable tbody');

          // Remove existing highlights
          $tableBody.find('mark').contents().unwrap();

          // Apply highlights if search term exists
          if (searchTerm) {
            // Escape special characters for regex
            const escapedTerm = searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`(${escapedTerm})`, 'gi');

            // Highlight Changelog column (list items)
            $tableBody.find('td:nth-child(4) li').each(function () {
              const $li = $(this);
              const originalHtml = $li.html();
              // Apply <mark> to matching text
              const newHtml = originalHtml.replace(regex, '<mark>$1</mark>');
              $li.html(newHtml);
            });

            // Highlight other columns (Product, Version, Date)
            $tableBody.find('td:nth-child(1), td:nth-child(2), td:nth-child(3)').each(function () {
              const $td = $(this);
              const originalHtml = $td.html();
              // Apply <mark> to matching text
              const newHtml = originalHtml.replace(regex, '<mark>$1</mark>');
              $td.html(newHtml);
            });
          }
        });

      } catch (error) {
        // Handle errors during table initialization
        console.error('Error initializing table:', error);
        $('.spinner').hide();
        $('.container').append('<div class="error-message" style="color: red; text-align: center; padding: 1rem;">Failed to initialize table. Please try again later.</div>');
      }
    },
    error: function (xhr, status, error) {
      // Handle JSON fetch errors
      console.error('Error fetching JSON:', status, error);
      $('.spinner').hide();
      $('.container').append('<div class="error-message" style="color: red; text-align: center; padding: 1rem;">Failed to load release data. Please try again later.</div>');
    }
  });
});