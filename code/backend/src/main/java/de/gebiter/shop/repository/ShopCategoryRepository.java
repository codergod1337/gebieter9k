package de.gebiter.shop.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import de.gebiter.shop.model.ShopCategory;

/** Die Rubriken des Gebietermarkts; nur der {@link de.gebiter.shop.service.ShopCategoryService} nutzt es. */
public interface ShopCategoryRepository extends JpaRepository<ShopCategory, String> {

	List<ShopCategory> findAllByOrderByListingPositionAscKeyAsc();

	Optional<ShopCategory> findTopByOrderByListingPositionDesc();
}
