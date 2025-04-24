import Component from "@glimmer/component";
import { dasherize } from "@ember/string";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";

export default class CustomHeaderLinks extends Component {
  @service router;
  @service search;
  @tracked activeTab = null;

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

      const linkClass = `${dasherize(linkText)}-custom-header-links`;
      const isActive = this.activeTab === linkText;

      const anchorAttributes = {
        title: linkTitle,
        href: linkHref,
        target: target === "self" ? "" : "_blank",
      };

      result.push({
        device: device ? `headerLink--${device}` : "",
        hideOnScroll: hideOnScroll ? "headerLink--hide-on-scroll" : "",
        locale: locale ? `headerLink--${locale}` : "",
        linkClass,
        anchorAttributes,
        linkText,
        isActive
      });

      return result;
    }, []);
  }
  
  @action
  toggleTab(tabName) {
    // If the tab is already active, deactivate it
    if (this.activeTab === tabName) {
      this.activeTab = null;
    } else {
      // Otherwise, set it as active
      this.activeTab = tabName;
    }
    return false; // Prevent default link behavior
  }
  
  @action
  handleSearch() {
    this.searchForum();
  }
  
  @action
  searchForum() {
    const searchInput = document.querySelector(".search-bar input");
    const searchValue = searchInput ? searchInput.value.trim() : "";
    
    if (searchValue) {
      // Use Discourse's search service if available (preferred method)
      if (this.search && typeof this.search.query === "function") {
        this.search.query(searchValue, {
          // Add search context if there's an active tab
          searchContext: this.activeTab ? { type: "category", name: this.activeTab } : null
        });
      } else {
        // Fallback: Navigate to search page with the query
        this.router.transitionTo("full-page-search", {
          queryParams: { 
            q: searchValue,
            context: this.activeTab ? this.activeTab.toLowerCase() : null
          }
        });
      }
    } else {
      // If no search value, just navigate to search page
      this.router.transitionTo("full-page-search");
    }
  }
  
  @action
  handleKeyPress(event) {
    // Check if the Enter key was pressed
    if (event.key === "Enter") {
      // Prevent the default form submission behavior
      event.preventDefault();
      // Call the forum search function
      this.searchForum();
    }
  }


}