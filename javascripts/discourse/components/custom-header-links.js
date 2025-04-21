import Component from "@glimmer/component";
import { dasherize } from "@ember/string";
import { action } from "@ember/object";

export default class CustomHeaderLinks extends Component {
  get shouldShow() {
    return settings.custom_header_links?.length > 0;
  }

  get links() {
    return settings.custom_header_links.reduce((result, link) => {
      const linkText = link.text;
      const linkTitle = link.title;
      const linkHref = link.url;
      const target = link.target;
      const hideOnScroll = link.hide_on_scroll;
      const locale = link.locale;
      const device = link.view;

      if (!linkText || (locale && document.documentElement.lang !== locale)) {
        return result;
      }

      const linkClass = `${dasherize(linkText)}-custom-header-links`; // legacy name

      const anchorAttributes = {
        title: linkTitle,
        href: linkHref,
        target: target === "self" ? "" : "_blank",
      };

      result.push({
        device: `headerLink--${device}`,
        hideOnScroll: `headerLink--${hideOnScroll}`,
        locale: locale ? `headerLink--${locale}` : null,
        linkClass,
        anchorAttributes,
        linkText,
      });

      return result;
    }, []);
  }
  
  @action
  searchHobbyDB() {
    const searchInput = document.querySelector(".search-bar input");
    const searchValue = searchInput ? searchInput.value.trim() : "";
    
    let url = "https://www.hobbydb.com/marketplaces/hobbydb/catalog_items";
    
    if (searchValue) {
      // Encode the search term for the URL
      const encodedSearch = encodeURIComponent(searchValue);
      url = `${url}?filters[q][0]=${encodedSearch}`;
    }
    
    // Open in a new tab
    window.open(url, "_blank");
  }

}