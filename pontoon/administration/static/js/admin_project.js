$(function() {

  // Before submitting the form
  $('form').submit(function (e) {
    // Update locales
    var arr = [];
    $("#selected").parent().siblings('ul').find('li:not(".no-match")').each(function() {
      arr.push($(this).data('id'));
    });
    $('#id_locales').val(arr);

    // Update form action
    var slug = $('#id_slug').val();
    if (slug.length > 0) {
      slug += '/';
    }
    $('form').attr('action', $('form').attr('action').split('/projects/')[0] + '/projects/' + slug);
  });

  // Submit form with Enter
  $('html').unbind("keydown.pontoon").bind("keydown.pontoon", function (e) {
    if ($('input[type=text]:not("input[type=search], #id_transifex_username, #id_transifex_password"):focus').length > 0) {
      var key = e.keyCode || e.which;
      if (key === 13) { // Enter
        // A short delay to allow digest of autocomplete before submit
        setTimeout(function() {
          $('form').submit();
        }, 1);
        return false;
      }
    }
  });

  // Suggest slugified name for new projects
  $('#id_name').blur(function() {
    if ($('input[name=pk]').length > 0 || !$('#id_name').val()) {
      return;
    }
    $('#id_slug').attr('placeholder', 'Retrieving...');
    $.ajax({
      url: '/admin/get-slug/',
      data: {
        name: $('#id_name').val()
      },
      success: function(data) {
        var value = (data === "error") ? "" : data;
        $('#id_slug').val(value);
      },
      error: function() {
        $('#id_slug').attr('placeholder', '');
      }
    });
  });

  // Choose locales
  $('.locale.select').on('click.pontoon', 'li', function (e) {
    var target = $(this).parents('.locale.select').siblings('.locale.select').find('ul'),
        clone = $(this).remove();
    target.prepend(clone);
  });

  // Choose/remove all locales
  $('.choose-all, .remove-all').click(function (e) {
    e.preventDefault();
    var ls = $(this).parents('.locale.select'),
        target = ls.siblings('.locale.select').find('ul'),
        items = ls.find('li:visible:not(".no-match")').remove();
    target.prepend(items);
  });

  // Select repository type
  $('body').click(function () {
    $('.repository')
      .find('.menu').hide().end()
      .find('.select').removeClass('opened');
  });
  $('.repository .type li').click(function () {
    var selected = $(this).html(),
        selected_lower = selected.toLowerCase();
    $(this).parents('.select').find('.title').html(selected);
    $('#id_repository_type').val(selected_lower);
    $('.details-wrapper').attr('data-repository-type', selected_lower);
  });
  // Show human-readable value
  $('.repository .type li[data-type=' + $('#id_repository_type').val() + ']').click();

  // Update from repository
  $('.repository, .transifex').on('click', '.update', function (e) {
    e.preventDefault();
    if ($(this).is('.disabled')) {
      return;
    }
    $(this).addClass('disabled');

    var source = $(this).data('source'),
        icon = $(this).find('span').attr('class', 'fa fa-refresh fa-spin'),
        params = {
          pk: $('input[name=pk]').val(),
          csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
        };

    if (source === 'transifex') {
      if (!$(this).parents('.authenticate').length) {
        project = $('.transifex input#id_transifex_project');
        resource = $('.transifex input#id_transifex_resource');
        params[project.attr('name')] = project.val();
        params[resource.attr('name')] = resource.val();
      } else {
        $('.transifex input').each(function() {
          var val = $(this).val();
          if (val) {
            if ($(this).attr('name') === 'remember') {
              params[$(this).attr('name')] = ($(this).is(':checked')) ? "on" : "off";
            } else {
              params[$(this).attr('name')] = val;
            }
          }
        });
      }
    }

    $.ajax({
      url: '/admin/' + source + '/',
      type: 'POST',
      data: params,
      success: function(data) {
        if (data === "200") {
          icon.attr('class', 'fa fa-check');
          $('.repository').removeClass('authenticate')
            .find('.errorlist').remove();
          $('.warning').animate({opacity: 0});
          $('.translate').removeClass('hidden');
        } else if (data === "authenticate") {
          icon.attr('class', 'fa fa-refresh');
          $('.repository').addClass('authenticate');
        } else if (data.type === "error") {
          icon.attr('class', 'fa fa-warning');
          $('.repository')
            .find('.errorlist').remove().end()
          .append(
            '<ul class="errorlist"><li>' + data.message + '</li></ul>');
        }
      },
      error: function() {
        icon.attr('class', 'fa fa-warning');
      }
    }).complete(function() {
      icon.parent().removeClass('disabled');
      setTimeout(function() {
        icon.attr('class', 'fa fa-refresh');
      }, 5000);
    });
  });

  // Delete subpage
  $('body').on('click.pontoon', '.delete-subpage', function (e) {
    e.preventDefault();
    $(this).parent().toggleClass('delete');
    $(this).next().prop('checked', !$(this).next().prop('checked'));
  });
  $('.subpages [checked]').click().prev().click();

  // Add subpage
  var count = $('.subpages:last').data('count');
  $('.add-subpage').click(function(e) {
    e.preventDefault();
    var form = $('.subpages:last').html().replace(/__prefix__/g, count);
    $('.subpages:last').before('<div class="subpages clearfix">' + form + '</div>');
    count++;
    $('#id_subpage_set-TOTAL_FORMS').val(count);
  });

  // Add repo
  $('.add-repo').click(function(e) {
    e.preventDefault();
    var $totalForms = $('#id_repositories-TOTAL_FORMS');
    var count = parseInt($totalForms.val(), 10);

    var $emptyForm = $('.repository-empty');
    var form = $emptyForm.html().replace(/__prefix__/g, count);
    $('.repository:last').after('<div class="repository clearfix">' + form + '</div>');

    $totalForms.val(count + 1);
  });

  // Delete project
  $('.delete-project').click(function (e) {
    e.preventDefault();
    if ($(this).is('.clicked')) {
      window.location = '/admin/delete/' + $('input[name=pk]').val();
    } else {
      $(this).addClass('clicked').html('Are you sure?');
    }
  });

  // Auto-Update project if chosen locales changed
  $('.repository.autoupdate .update:visible').click();

});
