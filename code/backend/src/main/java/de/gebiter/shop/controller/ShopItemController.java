package de.gebiter.shop.controller;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.gebiter.file.dto.FileUploadResult;
import de.gebiter.file.service.FileUploadService;
import de.gebiter.shop.dto.ShopItemForClient;
import de.gebiter.shop.dto.ShopItemResolveRequest;
import de.gebiter.shop.service.ShopItemService;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Die Artikel des Gebietermarkts für jeden angemeldeten User: in eine Rubrik hochladen (dabei entsteht der Artikel) und
 * die Artikel einer Rubrik auflösen. Wer hochladen darf, hängt an der FileClass (Schalter „Hochladen“) und daran, ob sie
 * in der Rubrik erlaubt ist. Er nutzt den {@link FileUploadService} und den {@link ShopItemService}, nie ein Repository.
 * <p>
 * Doku: {@code docu/entities/ShopItem.md}.
 */
@RestController
@RequestMapping("/api/shop-item")
public class ShopItemController {

	private final FileUploadService fileUploadService;

	private final ShopItemService shopItemService;

	public ShopItemController(FileUploadService fileUploadService, ShopItemService shopItemService) {
		this.fileUploadService = fileUploadService;
		this.shopItemService = shopItemService;
	}

	/**
	 * CREATE: Eine Datei in eine Rubrik des Gebietermarkts hochladen; nach dem Einchecken ist sie dort ein Artikel.
	 * Multipart: erst {@code data} als JSON {@code {"shopCategoryKey": "MEMES", "fieldValuesByFieldName":
	 * {"fileClassKey": "MEME"}}}, dann {@code file}.
	 */
	@PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<FileUploadResult> uploadFileIntoShopCategory(HttpServletRequest request) throws IOException {
		InputStream requestBody = request.getInputStream();
		String contentType = request.getContentType();
		long requestContentLength = request.getContentLengthLong();
		FileUploadResult uploadResult = fileUploadService.uploadFileIntoShopCategory(requestBody, contentType,
				requestContentLength);
		return ResponseEntity.ok(uploadResult);
	}

	/** READ: Die Artikel einer Rubrik, der neueste zuerst, je mit dem Dokument der Datei. Body: {@code {"shopCategoryKey": "MEMES"}}. */
	@PostMapping("/resolve")
	public ResponseEntity<List<ShopItemForClient>> resolveShopItems(@RequestBody ShopItemResolveRequest resolveRequest) {
		String shopCategoryKey = resolveRequest.shopCategoryKey();
		List<ShopItemForClient> shopItemsForClient = shopItemService.resolveShopItems(shopCategoryKey);
		return ResponseEntity.ok(shopItemsForClient);
	}
}
