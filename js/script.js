$(document).ready(function () {
  // Theme Toggle
  const $html = $('html');
  const $themeToggle = $('#themeToggle');
  const $toggleIcon = $themeToggle.find('i');

  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  $html.attr('data-theme', savedTheme);
  $toggleIcon.toggleClass('fa-solid fa-cloud-moon', savedTheme === 'light').toggleClass('fa-solid fa-mountain-sun', savedTheme === 'dark');

  // Toggle theme on click
  $themeToggle.on('click', function() {
    const currentTheme = $html.attr('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    $html.attr('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    $toggleIcon.toggleClass('fa-solid fa-cloud-moon', newTheme === 'light').toggleClass('fa-solid fa-mountain-sun', newTheme === 'dark');
  });

  // Show spinner while fetching data
  $('.spinner').show();

  // Fetch JSON data from external URL
  $.ajax({
    url: 'https://raw.githubusercontent.com/nayeemch/release-note-searcher/refs/heads/main/all-releases.json',
    method: 'GET',
    dataType: 'json',
    success: function (data) {
      // Hide spinner and show table
      $('.spinner').hide();
      $('#releaseTable').show();

      // Populate table
      const tableBody = $('#releaseTable tbody');
      data.forEach(item => {
        const contentList = item.changelogcontent.map(log => `<li>${log}</li>`).join('');
        const contentHtml = `<ul>${contentList}</ul>`;
        
        tableBody.append(`
          <tr>
            <td data-label="Product">${item.product}</td>
            <td data-label="Version">${item.version}</td>
            <td data-label="Date">${item.date}</td>
            <td data-label="Changelog">${contentHtml}</td>
          </tr>
        `);
      });

      // Initialize DataTable
      const table = $('#releaseTable').DataTable({
        pageLength: 10,
        order: [[2, 'desc']],
        columnDefs: [
          { targets: 3, orderable: false }
        ]
      });

      // Highlight search matches
      table.on('draw', function () {
        const searchTerm = $('.dataTables_filter input').val().trim();
        const $tableBody = $('#releaseTable tbody');

        $tableBody.find('td').removeHighlight();
        if (searchTerm) {
          $tableBody.find('td').highlight(searchTerm);
        }
      });
    },
    error: function (xhr, status, error) {
      // Hide spinner and show error message
      $('.spinner').hide();
      $('.container').append('<div class="error-message" style="color: red; text-align: center; padding: 1rem;">Failed to load release data. Please try again later.</div>');
      console.error('Error fetching JSON:', status, error);
    }
  });

  // Highlight plugin
  jQuery.fn.highlight = function (term) {
    if (!term) return this;
    const regex = new RegExp(`(${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    return this.each(function () {
      $(this).html(function (_, html) {
        return html.replace(regex, '<mark>$1</mark>');
      });
    });
  };

  jQuery.fn.removeHighlight = function () {
    return this.each(function () {
      $(this).html($(this).html().replace(/<\/?mark>/g, ''));
    });
  };
});