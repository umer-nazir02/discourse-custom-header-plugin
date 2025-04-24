import Component from "@glimmer/component";
import { dasherize } from "@ember/string";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
// Added tracked variable to compute button text

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
      if (this.activeTab) {
        // When there's an active tab, open search in a new tab with specific URLs based on activeTab
        try {
          const encodedSearchValue = encodeURIComponent(searchValue);
          let hobbydbUrl;
          
          // Set URL based on active tab
          switch (this.activeTab) {
            case "Database":
              hobbydbUrl = `https://www.hobbydb.com/marketplaces/hobbydb/catalog_items?filters[q][0]=${encodedSearchValue}`;
              break;
            case "Subjects":
              hobbydbUrl = `https://www.hobbydb.com/marketplaces/hobbydb/subjects?filters[q][0]=${encodedSearchValue}`;
              break;
            case "Market":
              hobbydbUrl = `https://www.hobbydb.com/marketplaces/hobbydb/collectibles/for_sale_search?filters[q][0]=${encodedSearchValue}`;
              break;
            case "Members":
              hobbydbUrl = `https://www.hobbydb.com/marketplaces/hobbydb/users?order[name]=collectible_count&order[sort]=desc&filters[q][0]=${encodedSearchValue}&page=1`;
              break;
            case "Local":
              hobbydbUrl = `https://www.hobbydb.com/marketplaces/hobbydb/local?filters[q][0]=${encodedSearchValue}`;
              break;
            case "Blog":
              hobbydbUrl = `https://blog.hobbydb.com/?s=${encodedSearchValue}`;
              break;
            default:
              break;
            // default:
            //   // Default fallback if none of the specified tabs match
            //   hobbydbUrl = `https://www.hobbydb.com/marketplaces/hobbydb/subjects?filters[q][0]=${encodedSearchValue}`;
          }

          if(this.activeTab === 'Forum'){
            if (this.search && typeof this.search.query === "function") {
              this.search.query(searchValue);
            } else {
              // Fallback: Navigate to search page with the query
              this.router.transitionTo("full-page-search", {
                queryParams: { q: searchValue }
              });
            }
            return;
          }
          
          // Open in a new tab
          window.open(hobbydbUrl, '_blank', 'noopener,noreferrer');
          
          // Clear the search input after opening the new tab
          if (searchInput) {
            searchInput.value = '';
          }
          
          // Return early to prevent default behavior
          return;
        } catch (error) {
          console.error("Error opening HobbyDB search:", error);
          // Fall through to default behavior if there's an error
        }
      }
      
      // No active tab or error occurred, use the original functionality
      // Use Discourse's search service if available (preferred method)
      if (this.search && typeof this.search.query === "function") {
        this.search.query(searchValue);
      } else {
        // Fallback: Navigate to search page with the query
        this.router.transitionTo("full-page-search", {
          queryParams: { q: searchValue }
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
      return false;
    }
    return true;
  }
}