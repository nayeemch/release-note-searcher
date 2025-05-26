$(document).ready(function () {
  // Load JSON data
  const rawData = document.getElementById('releaseData').textContent;
  const data = JSON.parse(rawData);
  const tableBody = $('#releaseTable tbody');

  // Populate table
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
    order: [[2, 'desc']], // Sort by Date descending
    columnDefs: [
      { targets: 3, orderable: false } // Disable sorting on Changelog column
    ]
  });

  // Highlight search matches on draw
  table.on('draw', function () {
    const searchTerm = $('.dataTables_filter input').val().trim();
    const $tableBody = $('#releaseTable tbody');

    // Remove old highlights
    $tableBody.find('td').removeHighlight();

    // Apply new highlights if search term exists
    if (searchTerm !== '') {
      $tableBody.find('td').highlight(searchTerm);
    }
  });

  // Toggle content visibility
  $(document).on('click', '.toggle-content', function () {
    const $this = $(this);
    const $ul = $this.closest('ul');
    const isExpanded = $this.data('expanded');

    if (isExpanded) {
      $ul.removeClass('expanded');
      $this.text('Show More').data('expanded', false);
    } else {
      $ul.addClass('expanded');
      $this.text('Show Less').data('expanded', true);
    }
  });

  // jQuery highlight plugin
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